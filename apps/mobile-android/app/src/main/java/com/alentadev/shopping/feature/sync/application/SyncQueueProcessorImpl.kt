package com.alentadev.shopping.feature.sync.application

import com.alentadev.shopping.core.data.database.dao.PendingSyncDao
import com.alentadev.shopping.feature.listdetail.data.remote.ListDetailApi
import com.alentadev.shopping.feature.listdetail.data.remote.UpdateItemCheckRequest
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.delay
import retrofit2.HttpException

@Singleton
class SyncQueueProcessorImpl @Inject constructor(
    private val pendingSyncDao: PendingSyncDao,
    private val listDetailApi: ListDetailApi,
    private val backoffPolicy: SyncBackoffPolicy,
    private val sleep: suspend (Long) -> Unit = { delay(it) }
) : SyncQueueProcessor {

    override suspend fun flushPendingSync() {
        val pendingOperations = pendingSyncDao.getPendingOrderedByLocalUpdatedAt()

        for (operation in pendingOperations) {
            try {
                listDetailApi.updateItemCheck(
                    operation.listId,
                    operation.itemId,
                    UpdateItemCheckRequest(operation.checked)
                )
                pendingSyncDao.delete(operation.operationId)
            } catch (exception: Exception) {
                if (exception.isPermanentError()) {
                    pendingSyncDao.markFailedPermanent(operation.operationId)
                } else {
                    pendingSyncDao.incrementRetry(operation.operationId)
                    val backoffDelay = backoffPolicy.delayMillisFor(operation.retryCount + 1)
                    sleep(backoffDelay)
                }
            }
        }
    }

    private fun Exception.isPermanentError(): Boolean {
        val httpException = this as? HttpException ?: return false
        return httpException.code() == 403 || httpException.code() == 404
    }

}
