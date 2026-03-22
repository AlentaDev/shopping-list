package com.alentadev.shopping.ui.navigation

import com.alentadev.shopping.core.network.ConnectivityGate
import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.feature.auth.domain.entity.Session
import com.alentadev.shopping.feature.auth.domain.entity.User
import com.alentadev.shopping.feature.auth.domain.usecase.GetCurrentUserUseCase
import com.alentadev.shopping.feature.auth.domain.usecase.ObserveSessionUseCase
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import java.io.IOException
import java.net.SocketTimeoutException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
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

    private lateinit var observeSessionUseCase: ObserveSessionUseCase
    private lateinit var getCurrentUserUseCase: GetCurrentUserUseCase
    private lateinit var connectivityGate: ConnectivityGate
    private lateinit var networkMonitor: NetworkMonitor

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Before
    fun setup() {
        observeSessionUseCase = mockk()
        getCurrentUserUseCase = mockk()
        connectivityGate = mockk()
        networkMonitor = mockk()
    }

    @Test
    fun `when there is no persisted session then state becomes unauthenticated`() = runTest(mainDispatcherRule.testDispatcher) {
        every { observeSessionUseCase.execute() } returns flowOf(null)
        every { networkMonitor.isConnected } returns flowOf(false)

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Unauthenticated, viewModel.state.value)
    }

    @Test
    fun `when persisted session exists and online and validation succeeds then state becomes authenticated`() = runTest(mainDispatcherRule.testDispatcher) {
        every { observeSessionUseCase.execute() } returns flowOf(testSession())
        every { connectivityGate.isOnline() } returns true
        every { networkMonitor.isConnected } returns flowOf(true)
        coEvery { getCurrentUserUseCase.execute() } returns testSession().user

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Authenticated, viewModel.state.value)
    }

    @Test
    fun `when persisted session exists and online and validation fails then state becomes unauthenticated`() = runTest(mainDispatcherRule.testDispatcher) {
        every { observeSessionUseCase.execute() } returns flowOf(testSession())
        every { connectivityGate.isOnline() } returns true
        every { networkMonitor.isConnected } returns flowOf(true)
        coEvery { getCurrentUserUseCase.execute() } throws IllegalStateException("expired")

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Unauthenticated, viewModel.state.value)
    }

    @Test
    fun `when persisted session exists and online and validation fails with IO then state remains offline recoverable`() = runTest(mainDispatcherRule.testDispatcher) {
        every { observeSessionUseCase.execute() } returns flowOf(testSession())
        every { connectivityGate.isOnline() } returns true
        every { networkMonitor.isConnected } returns flowOf(true)
        coEvery { getCurrentUserUseCase.execute() } throws IOException("network down")

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        advanceUntilIdle()

        assertEquals(AuthBootstrapState.OfflineRecoverable, viewModel.state.value)
    }

    @Test
    fun `when persisted session exists and online and validation times out then state remains offline recoverable`() = runTest(mainDispatcherRule.testDispatcher) {
        every { observeSessionUseCase.execute() } returns flowOf(testSession())
        every { connectivityGate.isOnline() } returns true
        every { networkMonitor.isConnected } returns flowOf(true)
        coEvery { getCurrentUserUseCase.execute() } throws SocketTimeoutException("timeout")

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        advanceUntilIdle()

        assertEquals(AuthBootstrapState.OfflineRecoverable, viewModel.state.value)
    }

    @Test
    fun `when persisted session exists and validation gets 401 then state becomes unauthenticated`() = runTest(mainDispatcherRule.testDispatcher) {
        every { observeSessionUseCase.execute() } returns flowOf(testSession())
        every { connectivityGate.isOnline() } returns true
        every { networkMonitor.isConnected } returns flowOf(true)
        coEvery { getCurrentUserUseCase.execute() } throws HttpException(
            Response.error<Any>(401, "unauthorized".toResponseBody(null))
        )

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Unauthenticated, viewModel.state.value)
    }

    @Test
    fun `when persisted session exists and offline then state becomes offline recoverable and skips remote validation`() = runTest(mainDispatcherRule.testDispatcher) {
        every { observeSessionUseCase.execute() } returns flowOf(testSession())
        every { connectivityGate.isOnline() } returns false
        every { networkMonitor.isConnected } returns flowOf(false)

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        advanceUntilIdle()

        assertEquals(AuthBootstrapState.OfflineRecoverable, viewModel.state.value)
        coVerify(exactly = 0) { getCurrentUserUseCase.execute() }
    }

    @Test
    fun `when connectivity reconnects during offline recoverable then retries auth check once`() = runTest(mainDispatcherRule.testDispatcher) {
        val connectivityFlow = MutableSharedFlow<Boolean>(replay = 0)
        every { observeSessionUseCase.execute() } returns flowOf(testSession())
        every { connectivityGate.isOnline() } returns false
        every { networkMonitor.isConnected } returns connectivityFlow
        coEvery { getCurrentUserUseCase.execute() } returns testSession().user

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        advanceUntilIdle()
        assertEquals(AuthBootstrapState.OfflineRecoverable, viewModel.state.value)

        connectivityFlow.emit(false)
        connectivityFlow.emit(true)
        connectivityFlow.emit(true)
        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Authenticated, viewModel.state.value)
        coVerify(exactly = 1) { getCurrentUserUseCase.execute() }
    }

    @Test
    fun `when reconnect auth check fails then state becomes unauthenticated and recoverable is cleared`() = runTest(mainDispatcherRule.testDispatcher) {
        val connectivityFlow = MutableSharedFlow<Boolean>(replay = 0)
        every { observeSessionUseCase.execute() } returns flowOf(testSession())
        every { connectivityGate.isOnline() } returns false
        every { networkMonitor.isConnected } returns connectivityFlow
        coEvery { getCurrentUserUseCase.execute() } throws IllegalStateException("expired")

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate,
            networkMonitor = networkMonitor
        )

        advanceUntilIdle()
        connectivityFlow.emit(false)
        connectivityFlow.emit(true)
        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Unauthenticated, viewModel.state.value)

        connectivityFlow.emit(false)
        connectivityFlow.emit(true)
        advanceUntilIdle()

        coVerify(exactly = 1) { getCurrentUserUseCase.execute() }
    }

    private fun testSession() = Session(
        user = User(
            id = "user-1",
            name = "Test",
            email = "test@example.com",
            postalCode = "28001"
        )
    )
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
