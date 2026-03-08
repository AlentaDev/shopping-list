package com.alentadev.shopping.feature.sync.application

import android.util.Log
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

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
        syncJob = scope.launch { runSyncCycle(trigger = "auth") }
    }

    override fun flushPendingQueue() {
        scope.launch { runSyncCycle(trigger = "reconnect_or_foreground") }
    }

    private suspend fun runSyncCycle(trigger: String) {
        Log.d("SyncCoordinator", "refresh_started resource=sync trigger=$trigger")
        val flushResult = runCatching { syncQueueProcessor.flushPendingSync() }
        Log.d("SyncCoordinator", "pending_flush_result status=${if (flushResult.isSuccess) "success" else "failed"}")
        runCatching { listsWarmupService.warmUp() }
        Log.d("SyncCoordinator", "refresh_finished resource=sync trigger=$trigger")
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
