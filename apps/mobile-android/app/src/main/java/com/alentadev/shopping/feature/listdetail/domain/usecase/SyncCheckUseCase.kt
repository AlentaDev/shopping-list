package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import retrofit2.HttpException
import java.io.IOException
import java.net.SocketTimeoutException
import javax.inject.Inject

sealed interface SyncCheckResult {
    data object Success : SyncCheckResult
    data object TransientFailure : SyncCheckResult
    data object PermanentFailure : SyncCheckResult
}

/**
 * Caso de uso para sincronizar un check de item con el servidor
 */
class SyncCheckUseCase @Inject constructor(
    private val repository: ListDetailRepository
) {
    suspend operator fun invoke(
        listId: String,
        itemId: String,
        checked: Boolean
    ): SyncCheckResult {
        require(listId.isNotBlank()) { "El ID de la lista no puede estar vacío" }
        require(itemId.isNotBlank()) { "El ID del item no puede estar vacío" }

        return try {
            repository.syncItemCheck(listId, itemId, checked)
            SyncCheckResult.Success
        } catch (e: Exception) {
            val localUpdatedAt = System.currentTimeMillis()
            when {
                e.isPermanentHttpError() -> {
                    repository.markCheckOperationFailedPermanent(listId, itemId, checked, localUpdatedAt)
                    SyncCheckResult.PermanentFailure
                }

                e.isTransientSyncError() -> {
                    repository.enqueuePendingCheckOperation(listId, itemId, checked, localUpdatedAt)
                    SyncCheckResult.TransientFailure
                }

                else -> {
                    repository.enqueuePendingCheckOperation(listId, itemId, checked, localUpdatedAt)
                    SyncCheckResult.TransientFailure
                }
            }
        }
    }

    private fun Exception.isPermanentHttpError(): Boolean {
        val httpException = this as? HttpException ?: return false
        return httpException.code() == 403 || httpException.code() == 404
    }

    private fun Exception.isTransientSyncError(): Boolean {
        return this is IOException ||
            this is SocketTimeoutException ||
            ((this as? HttpException)?.code() ?: 0) >= 500
    }
}
