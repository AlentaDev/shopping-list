package com.alentadev.shopping.feature.sync.application

import android.util.Log
import com.alentadev.shopping.core.data.database.dao.PendingSyncDao
import com.alentadev.shopping.core.data.database.entity.PendingSyncEntity
import com.alentadev.shopping.feature.listdetail.data.remote.ListDetailRemoteDataSource
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.delay
import retrofit2.HttpException

@Singleton
class SyncQueueProcessorImpl @Inject constructor(
    private val pendingSyncDao: PendingSyncDao,
    private val remoteDataSource: ListDetailRemoteDataSource,
    private val backoffPolicy: SyncBackoffPolicy
) : SyncQueueProcessor {

    override suspend fun flushPendingSync() {
        val pendingOperations = pendingSyncDao.getPendingOrderedByLocalUpdatedAt()
        Log.d("SyncQueueProcessor", "pending_flush_result status=start pendingBefore=${pendingOperations.size}")

        for (operation in pendingOperations) {
            try {
                when (operation.commandType) {
                    PendingSyncEntity.COMMAND_COMPLETE_LIST -> {
                        remoteDataSource.completeList(
                            listId = operation.listId,
                            checkedItemIds = operation.checkedItemIdsPayload.toCheckedItemIds()
                        )
                    }

                    else -> {
                        remoteDataSource.updateItemCheck(
                            listId = operation.listId,
                            itemId = operation.itemId,
                            checked = operation.checked
                        )
                    }
                }
                pendingSyncDao.delete(operation.operationId)
                Log.d("SyncQueueProcessor", "merge_result listId=${operation.listId} remoteItems=1 pendingOverrides=1")
            } catch (exception: Exception) {
                if (exception.isPermanentError()) {
                    Log.w("SyncQueueProcessor", "failure_category type=permanent code=${(exception as HttpException).code()}")
                    pendingSyncDao.markFailedPermanent(operation.operationId)
                } else {
                    Log.w("SyncQueueProcessor", "failure_category type=transient operationId=${operation.operationId}")
                    pendingSyncDao.incrementRetry(operation.operationId)
                    val backoffDelay = backoffPolicy.delayMillisFor(operation.retryCount + 1)
                    delay(backoffDelay)
                }
            }
        }

        val pendingAfter = pendingSyncDao.getPendingOrderedByLocalUpdatedAt().size
        Log.d("SyncQueueProcessor", "pending_flush_result status=finished pendingAfter=$pendingAfter")
    }

    override suspend fun hasPendingSyncOperations(): Boolean {
        return pendingSyncDao.getPendingOrderedByLocalUpdatedAt().isNotEmpty()
    }

    private fun Exception.isPermanentError(): Boolean {
        val httpException = this as? HttpException ?: return false
        return httpException.code() == 403 || httpException.code() == 404
    }

    private fun String?.toCheckedItemIds(): List<String> {
        if (this.isNullOrBlank()) return emptyList()
        return split(",").map { it.trim() }.filter { it.isNotBlank() }
    }
}
