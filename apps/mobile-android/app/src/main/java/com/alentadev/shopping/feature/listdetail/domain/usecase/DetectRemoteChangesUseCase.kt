package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import com.alentadev.shopping.feature.sync.domain.UpdatedAtComparison
import com.alentadev.shopping.feature.sync.domain.UpdatedAtComparator
import javax.inject.Inject

class DetectRemoteChangesUseCase @Inject constructor(
    private val repository: ListDetailRepository,
    private val updatedAtComparator: UpdatedAtComparator
) {
    suspend operator fun invoke(listId: String): Boolean {
        require(listId.isNotBlank()) { "El ID de la lista no puede estar vacío" }

        val localUpdatedAt = repository.getCachedListUpdatedAt(listId) ?: return false
        val remoteUpdatedAt = repository.getRemoteListUpdatedAt(listId)

        return updatedAtComparator.compare(remoteUpdatedAt, localUpdatedAt) == UpdatedAtComparison.REMOTE_NEWER
    }
}
