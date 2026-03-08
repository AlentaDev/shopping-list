package com.alentadev.shopping.feature.sync.application

import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SyncCoordinatorImplTest {

    @Test
    fun `startForAuthenticatedSession launches warm-up`() = runTest {
        val warmupService = mockk<ListsWarmupService>(relaxed = true)
        val coordinator = SyncCoordinatorImpl(
            listsWarmupService = warmupService,
            dispatcher = StandardTestDispatcher(testScheduler)
        )

        coordinator.startForAuthenticatedSession()
        advanceUntilIdle()

        coVerify(exactly = 1) { warmupService.warmUp() }
    }
}
