package com.alentadev.shopping.ui.navigation

import com.alentadev.shopping.core.network.ConnectivityGate
import com.alentadev.shopping.feature.auth.domain.entity.Session
import com.alentadev.shopping.feature.auth.domain.entity.User
import com.alentadev.shopping.feature.auth.domain.usecase.GetCurrentUserUseCase
import com.alentadev.shopping.feature.auth.domain.usecase.ObserveSessionUseCase
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
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

@OptIn(ExperimentalCoroutinesApi::class)
class SessionGateViewModelTest {

    private lateinit var observeSessionUseCase: ObserveSessionUseCase
    private lateinit var getCurrentUserUseCase: GetCurrentUserUseCase
    private lateinit var connectivityGate: ConnectivityGate

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Before
    fun setup() {
        observeSessionUseCase = mockk()
        getCurrentUserUseCase = mockk()
        connectivityGate = mockk()
    }

    @Test
    fun `when there is no persisted session then state becomes unauthenticated`() = runTest(mainDispatcherRule.testDispatcher) {
        every { observeSessionUseCase.execute() } returns flowOf(null)

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate
        )

        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Unauthenticated, viewModel.state.value)
    }

    @Test
    fun `when persisted session exists and online and validation succeeds then state becomes authenticated`() = runTest(mainDispatcherRule.testDispatcher) {
        every { observeSessionUseCase.execute() } returns flowOf(testSession())
        every { connectivityGate.isOnline() } returns true
        coEvery { getCurrentUserUseCase.execute() } returns testSession().user

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate
        )

        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Authenticated, viewModel.state.value)
    }

    @Test
    fun `when persisted session exists and online and validation fails then state becomes unauthenticated`() = runTest(mainDispatcherRule.testDispatcher) {
        every { observeSessionUseCase.execute() } returns flowOf(testSession())
        every { connectivityGate.isOnline() } returns true
        coEvery { getCurrentUserUseCase.execute() } throws IllegalStateException("expired")

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate
        )

        advanceUntilIdle()

        assertEquals(AuthBootstrapState.Unauthenticated, viewModel.state.value)
    }

    @Test
    fun `when persisted session exists and offline then state becomes offline recoverable and skips remote validation`() = runTest(mainDispatcherRule.testDispatcher) {
        every { observeSessionUseCase.execute() } returns flowOf(testSession())
        every { connectivityGate.isOnline() } returns false

        val viewModel = SessionGateViewModel(
            observeSessionUseCase = observeSessionUseCase,
            getCurrentUserUseCase = getCurrentUserUseCase,
            connectivityGate = connectivityGate
        )

        advanceUntilIdle()

        assertEquals(AuthBootstrapState.OfflineRecoverable, viewModel.state.value)
        coVerify(exactly = 0) { getCurrentUserUseCase.execute() }
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
