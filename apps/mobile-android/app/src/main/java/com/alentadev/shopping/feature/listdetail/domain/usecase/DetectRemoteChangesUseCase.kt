package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import java.time.Instant
import javax.inject.Inject

/**
 * Caso de uso para detectar si la lista fue modificada remotamente.
 */
class DetectRemoteChangesUseCase @Inject constructor(
    private val repository: ListDetailRepository
) {
    suspend operator fun invoke(listId: String): Boolean {
        require(listId.isNotBlank()) { "El ID de la lista no puede estar vacío" }

        val localUpdatedAt = repository.getCachedListUpdatedAt(listId) ?: return false
        val remoteUpdatedAt = repository.getRemoteListUpdatedAt(listId)

        val localInstant = localUpdatedAt.toInstantOrNull() ?: return false
        val remoteInstant = remoteUpdatedAt.toInstantOrNull() ?: return false

        return remoteInstant.isAfter(localInstant)
    }

    private fun String.toInstantOrNull(): Instant? =
        runCatching { Instant.parse(this) }.getOrNull()
}
