package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import com.alentadev.shopping.feature.sync.domain.UpdatedAtComparison
import com.alentadev.shopping.feature.sync.domain.UpdatedAtComparator
import javax.inject.Inject

enum class RefreshDetailDecision {
    FETCH_MISSING,
    REFRESH_REMOTE_NEWER,
    SKIP_EQUAL
}

class RefreshListDetailIfNeededUseCase @Inject constructor(
    private val repository: ListDetailRepository,
    private val updatedAtComparator: UpdatedAtComparator
) {
    suspend operator fun invoke(listId: String): RefreshDetailDecision {
        val localUpdatedAt = repository.getCachedListUpdatedAt(listId)
        val remoteUpdatedAt = repository.getRemoteListUpdatedAt(listId)

        if (localUpdatedAt == null) {
            repository.refreshListDetail(listId)
            return RefreshDetailDecision.FETCH_MISSING
        }

        return when (updatedAtComparator.compare(remoteUpdatedAt, localUpdatedAt)) {
            UpdatedAtComparison.REMOTE_NEWER -> {
                repository.refreshListDetail(listId)
                RefreshDetailDecision.REFRESH_REMOTE_NEWER
            }
            UpdatedAtComparison.NOT_NEWER,
            UpdatedAtComparison.PARSE_FAILURE -> RefreshDetailDecision.SKIP_EQUAL
        }
    }
}
