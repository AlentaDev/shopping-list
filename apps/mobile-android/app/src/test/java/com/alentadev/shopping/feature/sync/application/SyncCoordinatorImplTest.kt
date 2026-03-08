package com.alentadev.shopping.feature.sync.application

import io.mockk.coEvery
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
        coEvery { syncQueueProcessor.hasPendingSyncOperations() } returns false
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

    @Test
    fun `flushPendingQueue launches only pending sync flush`() = runTest {
        val warmupService = mockk<ListsWarmupService>(relaxed = true)
        val syncQueueProcessor = mockk<SyncQueueProcessor>(relaxed = true)
        coEvery { syncQueueProcessor.hasPendingSyncOperations() } returns false
        val coordinator = SyncCoordinatorImpl(
            listsWarmupService = warmupService,
            syncQueueProcessor = syncQueueProcessor,
            dispatcher = StandardTestDispatcher(testScheduler)
        )

        coordinator.flushPendingQueue()
        advanceUntilIdle()

        coVerify(exactly = 0) { warmupService.warmUp() }
        coVerify(exactly = 1) { syncQueueProcessor.flushPendingSync() }
    }


    @Test
    fun `startForAuthenticatedSession skips warm-up when pending operations remain after flush`() = runTest {
        val warmupService = mockk<ListsWarmupService>(relaxed = true)
        val syncQueueProcessor = mockk<SyncQueueProcessor>(relaxed = true)
        coEvery { syncQueueProcessor.hasPendingSyncOperations() } returns true
        val coordinator = SyncCoordinatorImpl(
            listsWarmupService = warmupService,
            syncQueueProcessor = syncQueueProcessor,
            dispatcher = StandardTestDispatcher(testScheduler)
        )

        coordinator.startForAuthenticatedSession()
        advanceUntilIdle()

        coVerify(exactly = 1) { syncQueueProcessor.flushPendingSync() }
        coVerify(exactly = 1) { syncQueueProcessor.hasPendingSyncOperations() }
        coVerify(exactly = 0) { warmupService.warmUp() }
    }

}
