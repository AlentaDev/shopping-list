package com.alentadev.shopping.ui.navigation

import com.alentadev.shopping.core.network.ConnectivityGate
import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.feature.auth.domain.entity.Session
import com.alentadev.shopping.feature.auth.domain.entity.User
import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository
import com.alentadev.shopping.feature.auth.domain.usecase.GetCurrentUserUseCase
import com.alentadev.shopping.feature.auth.domain.usecase.ObserveSessionUseCase
import io.mockk.every
import io.mockk.mockk
import java.io.IOException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.test.resetMain
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestWatcher
import org.junit.runner.Description
import retrofit2.HttpException
import retrofit2.Response
import okhttp3.ResponseBody.Companion.toResponseBody

@OptIn(ExperimentalCoroutinesApi::class)
class SessionGateViewModelTest {

    private lateinit var fakeAuthRepository: FakeAuthRepository
    private lateinit var observeSessionUseCase: ObserveSessionUseCase
    private lateinit var getCurrentUserUseCase: GetCurrentUserUseCase
    private lateinit var connectivityGate: FakeConnectivityGate
    private lateinit var networkMonitor: NetworkMonitor

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Before
    fun setup() {
        fakeAuthRepository = FakeAuthRepository()
        observeSessionUseCase = ObserveSessionUseCase(fakeAuthRepository)
        getCurrentUserUseCase = GetCurrentUserUseCase(fakeAuthRepository)
        connectivityGate = FakeConnectivityGate(isOnline = true)
        networkMonitor = mockk()
    }

    @Test
    fun `state machine transitions unknown to authenticated when session exists and auth succeeds`() = runTest(mainDispatcherRule.testDispatcher) {
        val connectivityFlow = MutableStateFlow(true)
        every { networkMonitor.isConnected } returns connectivityFlow
        fakeAuthRepository.sessionFlow.value = testSession()
        fakeAuthRepository.currentSessionResult = Result.success(testSession())

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        val firstTransition = viewModel.state.drop(1).first()
        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Authenticated, firstTransition)
        assertEquals(AuthBootstrapState.Authenticated, viewModel.state.value)
    }

    @Test
    fun `state machine transitions unknown to unauthenticated when no persisted session`() = runTest(mainDispatcherRule.testDispatcher) {
        val connectivityFlow = MutableStateFlow(true)
        every { networkMonitor.isConnected } returns connectivityFlow
        fakeAuthRepository.sessionFlow.value = null

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        val firstTransition = viewModel.state.drop(1).first()
        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Unauthenticated, firstTransition)
        assertEquals(AuthBootstrapState.Unauthenticated, viewModel.state.value)
    }

    @Test
    fun `state machine transitions offline recoverable to authenticated on reconnect`() = runTest(mainDispatcherRule.testDispatcher) {
        val connectivityFlow = MutableSharedFlow<Boolean>(replay = 0)
        every { networkMonitor.isConnected } returns connectivityFlow
        connectivityGate.isOnline = false
        fakeAuthRepository.sessionFlow.value = testSession()
        fakeAuthRepository.currentSessionResult = Result.success(testSession())

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        advanceUntilIdle()
        assertEquals(AuthBootstrapState.OfflineRecoverable, viewModel.state.value)

        connectivityGate.isOnline = true
        connectivityFlow.emit(false)
        connectivityFlow.emit(true)
        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Authenticated, viewModel.state.value)
    }

    @Test
    fun `state machine transitions offline recoverable to unauthenticated on definitive auth failure`() = runTest(mainDispatcherRule.testDispatcher) {
        val connectivityFlow = MutableSharedFlow<Boolean>(replay = 0)
        every { networkMonitor.isConnected } returns connectivityFlow
        connectivityGate.isOnline = false
        fakeAuthRepository.sessionFlow.value = testSession()
        fakeAuthRepository.currentSessionResult = Result.failure(
            HttpException(Response.error<Any>(401, "unauthorized".toResponseBody(null)))
        )

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        advanceUntilIdle()
        assertEquals(AuthBootstrapState.OfflineRecoverable, viewModel.state.value)

        connectivityGate.isOnline = true
        connectivityFlow.emit(false)
        connectivityFlow.emit(true)
        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Unauthenticated, viewModel.state.value)
    }

    @Test
    fun `dedup retries run once per connectivity transition`() = runTest(mainDispatcherRule.testDispatcher) {
        val connectivityFlow = MutableSharedFlow<Boolean>(replay = 0)
        every { networkMonitor.isConnected } returns connectivityFlow
        connectivityGate.isOnline = false
        fakeAuthRepository.sessionFlow.value = testSession()
        fakeAuthRepository.currentSessionResult = Result.failure(IOException("network down"))

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        advanceUntilIdle()
        assertEquals(AuthBootstrapState.OfflineRecoverable, viewModel.state.value)
        assertEquals(0, fakeAuthRepository.getCurrentSessionCalls)

        connectivityGate.isOnline = true
        connectivityFlow.emit(false)
        connectivityFlow.emit(true)
        connectivityFlow.emit(true)
        advanceUntilIdle()

        assertEquals(1, fakeAuthRepository.getCurrentSessionCalls)
        assertEquals(AuthBootstrapState.OfflineRecoverable, viewModel.state.value)

        connectivityFlow.emit(false)
        connectivityFlow.emit(true)
        connectivityFlow.emit(true)
        advanceUntilIdle()

        assertEquals(2, fakeAuthRepository.getCurrentSessionCalls)
        assertEquals(AuthBootstrapState.OfflineRecoverable, viewModel.state.value)
    }

    private fun testSession() = Session(
        user = User(
            id = "user-1",
            name = "Test",
            email = "test@example.com",
            postalCode = "28001"
        ),
        createdAt = 1L,
        isAuthenticated = true
    )
}

private class FakeConnectivityGate(
    var isOnline: Boolean
) : ConnectivityGate {
    override fun isOnline(): Boolean = isOnline
}

private class FakeAuthRepository : AuthRepository {
    val sessionFlow = MutableStateFlow<Session?>(null)
    var currentSessionResult: Result<Session> = Result.failure(IllegalStateException("missing session"))
    var getCurrentSessionCalls: Int = 0

    override suspend fun login(email: String, password: String): Session {
        throw UnsupportedOperationException("Not needed for this test")
    }

    override suspend fun logout() {
        throw UnsupportedOperationException("Not needed for this test")
    }

    override suspend fun getCurrentSession(): Session {
        getCurrentSessionCalls += 1
        return currentSessionResult.getOrThrow()
    }

    override fun observeSession(): Flow<Session?> = sessionFlow
}

@OptIn(ExperimentalCoroutinesApi::class)
class MainDispatcherRule(
    val testDispatcher: TestDispatcher = StandardTestDispatcher()
) : TestWatcher() {
    override fun starting(description: Description) {
        Dispatchers.setMain(testDispatcher)
    }

    override fun finished(description: Description) {
        Dispatchers.resetMain()
    }
}
