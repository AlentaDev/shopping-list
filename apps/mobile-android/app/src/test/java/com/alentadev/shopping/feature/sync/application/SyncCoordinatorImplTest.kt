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
    fun `startForAuthenticatedSession launches warm-up and pending sync flush`() = runTest {
        val warmupService = mockk<ListsWarmupService>(relaxed = true)
        val syncQueueProcessor = mockk<SyncQueueProcessor>(relaxed = true)
        val coordinator = SyncCoordinatorImpl(
            listsWarmupService = warmupService,
            syncQueueProcessor = syncQueueProcessor,
            dispatcher = StandardTestDispatcher(testScheduler)
        )

        coordinator.startForAuthenticatedSession()
        advanceUntilIdle()

        coVerify(exactly = 1) { warmupService.warmUp() }
        coVerify(exactly = 1) { syncQueueProcessor.flushPendingSync() }
    }
}
