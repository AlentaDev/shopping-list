package com.alentadev.shopping.feature.sync.application

import android.util.Log
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

@Singleton
class SyncCoordinatorImpl @Inject constructor(
    private val listsWarmupService: ListsWarmupService,
    private val syncQueueProcessor: SyncQueueProcessor,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) : SyncCoordinator {
    private val scope = CoroutineScope(SupervisorJob() + dispatcher)
    private var syncJob: Job? = null
    private val cycleMutex = Mutex()
    private var inFlightCycle: Deferred<Unit>? = null

    override fun startForAuthenticatedSession() {
        scheduleSyncCycle(trigger = "auth")
    }

    override fun flushPendingQueue() {
        scheduleSyncCycle(trigger = "reconnect_or_foreground")
    }

    private fun scheduleSyncCycle(trigger: String) {
        syncJob?.cancel()
        syncJob = scope.launch {
            val cycle = cycleMutex.withLock {
                val existing = inFlightCycle
                if (existing != null && !existing.isCompleted) {
                    Log.d("SyncCoordinator", "sync_cycle_single_flight status=join trigger=$trigger")
                    existing
                } else {
                    Log.d("SyncCoordinator", "sync_cycle_single_flight status=leader trigger=$trigger")
                    scope.async {
                        runSyncCycle(trigger = trigger)
                    }.also { inFlightCycle = it }
                }
            }

            cycle.await()
            cycleMutex.withLock {
                if (inFlightCycle === cycle && cycle.isCompleted) {
                    inFlightCycle = null
                }
            }
        }
    }

    private suspend fun runSyncCycle(trigger: String) {
        Log.d("SyncCoordinator", "refresh_started resource=sync trigger=$trigger event=sync_cycle_started")
        val flushResult = runCatching { syncQueueProcessor.flushPendingSync() }
        Log.d("SyncCoordinator", "pending_flush_result status=${if (flushResult.isSuccess) "success" else "failed"} trigger=$trigger")
        val warmupResult = runCatching { listsWarmupService.warmUp() }
        Log.d("SyncCoordinator", "warmup_result status=${if (warmupResult.isSuccess) "success" else "failed"} trigger=$trigger")
        Log.d("SyncCoordinator", "refresh_finished resource=sync trigger=$trigger event=sync_cycle_finished")
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
