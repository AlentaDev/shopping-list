package com.alentadev.shopping.feature.sync.application

import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.launch
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SyncCoordinatorImplTest {

    @Test
    fun `start and flush triggers share a single in-flight sync cycle`() = runTest {
        val warmupService = mockk<ListsWarmupService>(relaxed = true)
        val syncQueueProcessor = mockk<SyncQueueProcessor>()
        val gate = CompletableDeferred<Unit>()
        coEvery { syncQueueProcessor.flushPendingSync() } coAnswers {
            gate.await()
            Unit
        }

        val coordinator = SyncCoordinatorImpl(
            listsWarmupService = warmupService,
            syncQueueProcessor = syncQueueProcessor,
            dispatcher = StandardTestDispatcher(testScheduler)
        )

        coordinator.startForAuthenticatedSession()
        launch { coordinator.flushPendingQueue() }
        advanceUntilIdle()

        coVerify(exactly = 1) { syncQueueProcessor.flushPendingSync() }
        coVerify(exactly = 0) { warmupService.warmUp() }

        gate.complete(Unit)
        advanceUntilIdle()

        coVerify(exactly = 1) { syncQueueProcessor.flushPendingSync() }
        coVerify(exactly = 1) { warmupService.warmUp() }
    }

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
    fun `flushPendingQueue launches pending sync flush and warm-up`() = runTest {
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

        coVerify(exactly = 1) { warmupService.warmUp() }
        coVerify(exactly = 1) { syncQueueProcessor.flushPendingSync() }
    }


    @Test
    fun `startForAuthenticatedSession still executes warm-up when pending operations remain after flush`() = runTest {
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
        coVerify(exactly = 0) { syncQueueProcessor.hasPendingSyncOperations() }
        coVerify(exactly = 1) { warmupService.warmUp() }
    }

    @Test
    fun `startForAuthenticatedSession executes warm-up even when flush fails`() = runTest {
        val warmupService = mockk<ListsWarmupService>(relaxed = true)
        val syncQueueProcessor = mockk<SyncQueueProcessor>()
        coEvery { syncQueueProcessor.flushPendingSync() } throws RuntimeException("flush error")

        val coordinator = SyncCoordinatorImpl(
            listsWarmupService = warmupService,
            syncQueueProcessor = syncQueueProcessor,
            dispatcher = StandardTestDispatcher(testScheduler)
        )

        coordinator.startForAuthenticatedSession()
        advanceUntilIdle()

        coVerify(exactly = 1) { syncQueueProcessor.flushPendingSync() }
        coVerify(exactly = 1) { warmupService.warmUp() }
    }

}
