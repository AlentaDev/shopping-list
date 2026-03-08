package com.alentadev.shopping.feature.sync.application

import android.util.Log
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
            val hasLocalItems = listDetailRepository.hasCachedListItems(list.id)
            val localSnapshotTimestamp = listDetailRepository.getCachedSnapshotTimestamp(list.id)
            val decision = if (!hasLocalItems) {
                RefreshDecision.FETCH_MISSING
            } else {
                refreshDecisionPolicy.decide(
                    remoteSummaryTimestamp = list.updatedAt,
                    localSnapshotTimestamp = localSnapshotTimestamp,
                    hasLocalSnapshot = hasLocalSnapshot
                )
            }
            Log.d("ListsWarmupService", "refresh_decision listId=${list.id} decision=$decision")
            when (decision) {
                RefreshDecision.FETCH_MISSING,
                RefreshDecision.REFRESH_REMOTE_NEWER -> runCatching { listDetailRepository.refreshListDetail(list.id) }
                RefreshDecision.SKIP_EQUAL -> Unit
            }
        }
    }
}
