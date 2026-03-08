package com.alentadev.shopping.feature.sync.application

import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncCoordinatorImpl @Inject constructor(
    private val listsWarmupService: ListsWarmupService,
    private val syncQueueProcessor: SyncQueueProcessor,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) : SyncCoordinator {
    private val scope = CoroutineScope(SupervisorJob() + dispatcher)
    private var syncJob: Job? = null

    override fun startForAuthenticatedSession() {
        syncJob?.cancel()
        syncJob = scope.launch {
            runCatching { syncQueueProcessor.flushPendingSync() }
            val hasPendingOperations = runCatching {
                syncQueueProcessor.hasPendingSyncOperations()
            }.getOrDefault(true)
            if (!hasPendingOperations) {
                runCatching { listsWarmupService.warmUp() }
            }
        }
    }

    override fun flushPendingQueue() {
        scope.launch {
            runCatching { syncQueueProcessor.flushPendingSync() }
        }
    }

    override fun cancel() {
        syncJob?.cancel()
        syncJob = null
    }

    fun clear() {
        cancel()
        scope.cancel()
    }
}
