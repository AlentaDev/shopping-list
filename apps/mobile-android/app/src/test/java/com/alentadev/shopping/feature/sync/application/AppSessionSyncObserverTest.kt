package com.alentadev.shopping.feature.sync.application

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
        val observeSessionUseCase = mockk<ObserveSessionUseCase>()
        val syncCoordinator = mockk<SyncCoordinator>(relaxed = true)
        every { observeSessionUseCase.execute() } returns sessions
        val observer = AppSessionSyncObserver(observeSessionUseCase, syncCoordinator)

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
}
