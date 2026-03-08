package com.alentadev.shopping.feature.sync.application

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import com.alentadev.shopping.feature.sync.domain.RefreshDecision
import com.alentadev.shopping.feature.sync.domain.RefreshDecisionPolicy
import javax.inject.Inject

class ListsWarmupServiceImpl @Inject constructor(
    private val listsRepository: ListsRepository,
    private val listDetailRepository: ListDetailRepository,
    private val refreshDecisionPolicy: RefreshDecisionPolicy
) : ListsWarmupService {

    override suspend fun warmUp() {
        val activeLists = listsRepository.refreshActiveLists()
        if (activeLists.isEmpty()) return

        activeLists.forEach { list ->
            val hasLocalSnapshot = listDetailRepository.hasCachedListDetail(list.id)
            val localSnapshotTimestamp = listDetailRepository.getCachedSnapshotTimestamp(list.id)
            when (
                refreshDecisionPolicy.decide(
                    remoteSummaryTimestamp = list.updatedAt,
                    localSnapshotTimestamp = localSnapshotTimestamp,
                    hasLocalSnapshot = hasLocalSnapshot
                )
            ) {
                RefreshDecision.FETCH_MISSING,
                RefreshDecision.REFRESH_REMOTE_NEWER -> {
                    runCatching { listDetailRepository.refreshListDetail(list.id) }
                }
                RefreshDecision.SKIP_EQUAL -> Unit
            }
        }
    }
}
