package com.alentadev.shopping.feature.sync.application

import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.feature.auth.domain.entity.Session
import com.alentadev.shopping.feature.auth.domain.entity.User
import com.alentadev.shopping.feature.auth.domain.usecase.ObserveSessionUseCase
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AppSessionSyncObserverTest {

    @Test
    fun `starts warm-up when session becomes authenticated and cancels on logout`() = runTest {
        val sessions = MutableStateFlow<Session?>(null)
        val connectivity = MutableStateFlow(false)
        val observeSessionUseCase = mockk<ObserveSessionUseCase>()
        val networkMonitor = mockk<NetworkMonitor>()
        val syncCoordinator = mockk<SyncCoordinator>(relaxed = true)
        every { observeSessionUseCase.execute() } returns sessions
        every { networkMonitor.isConnected } returns connectivity
        every { networkMonitor.isCurrentlyConnected() } returns false
        val observer = AppSessionSyncObserver(observeSessionUseCase, networkMonitor, syncCoordinator)

        val testScope = TestScope(StandardTestDispatcher(testScheduler))
        observer.start(testScope)

        sessions.value = Session(
            user = User("id", "name", "email@test.com", "08001")
        )
        advanceUntilIdle()

        verify(exactly = 1) { syncCoordinator.startForAuthenticatedSession() }

        sessions.value = null
        advanceUntilIdle()

        verify(exactly = 1) { syncCoordinator.cancel() }
    }

    @Test
    fun `flushes pending queue when network reconnects during authenticated session`() = runTest {
        val sessions = MutableStateFlow<Session?>(null)
        val connectivity = MutableStateFlow(false)
        val observeSessionUseCase = mockk<ObserveSessionUseCase>()
        val networkMonitor = mockk<NetworkMonitor>()
        val syncCoordinator = mockk<SyncCoordinator>(relaxed = true)
        every { observeSessionUseCase.execute() } returns sessions
        every { networkMonitor.isConnected } returns connectivity
        every { networkMonitor.isCurrentlyConnected() } returns false
        val observer = AppSessionSyncObserver(observeSessionUseCase, networkMonitor, syncCoordinator)

        val testScope = TestScope(StandardTestDispatcher(testScheduler))
        observer.start(testScope)

        sessions.value = Session(user = User("id", "name", "email@test.com", "08001"))
        connectivity.value = true
        advanceUntilIdle()

        verify(exactly = 1) { syncCoordinator.flushPendingQueue() }
    }

    @Test
    fun `does not flush pending queue on reconnect when not authenticated`() = runTest {
        val sessions = MutableStateFlow<Session?>(null)
        val connectivity = MutableStateFlow(false)
        val observeSessionUseCase = mockk<ObserveSessionUseCase>()
        val networkMonitor = mockk<NetworkMonitor>()
        val syncCoordinator = mockk<SyncCoordinator>(relaxed = true)
        every { observeSessionUseCase.execute() } returns sessions
        every { networkMonitor.isConnected } returns connectivity
        every { networkMonitor.isCurrentlyConnected() } returns false
        val observer = AppSessionSyncObserver(observeSessionUseCase, networkMonitor, syncCoordinator)

        val testScope = TestScope(StandardTestDispatcher(testScheduler))
        observer.start(testScope)

        connectivity.value = true
        advanceUntilIdle()

        verify(exactly = 0) { syncCoordinator.flushPendingQueue() }
    }

    @Test
    fun `flushes pending queue on app foreground only when authenticated`() = runTest {
        val sessions = MutableStateFlow<Session?>(null)
        val connectivity = MutableStateFlow(false)
        val observeSessionUseCase = mockk<ObserveSessionUseCase>()
        val networkMonitor = mockk<NetworkMonitor>()
        val syncCoordinator = mockk<SyncCoordinator>(relaxed = true)
        every { observeSessionUseCase.execute() } returns sessions
        every { networkMonitor.isConnected } returns connectivity
        every { networkMonitor.isCurrentlyConnected() } returns false
        val observer = AppSessionSyncObserver(observeSessionUseCase, networkMonitor, syncCoordinator)

        val testScope = TestScope(StandardTestDispatcher(testScheduler))
        observer.start(testScope)

        observer.onAppForeground()
        advanceUntilIdle()

        verify(exactly = 0) { syncCoordinator.flushPendingQueue() }

        sessions.value = Session(user = User("id", "name", "email@test.com", "08001"))
        advanceUntilIdle()

        observer.onAppForeground()
        advanceUntilIdle()

        verify(exactly = 1) { syncCoordinator.flushPendingQueue() }
    }
}
