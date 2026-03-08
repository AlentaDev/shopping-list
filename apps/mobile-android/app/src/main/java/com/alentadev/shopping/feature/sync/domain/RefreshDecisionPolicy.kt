package com.alentadev.shopping.feature.sync.domain

import javax.inject.Inject

enum class RefreshDecision {
    FETCH_MISSING,
    SKIP_EQUAL,
    REFRESH_REMOTE_NEWER
}

interface RefreshDecisionPolicy {
    fun decide(
        remoteSummaryTimestamp: Long,
        localSnapshotTimestamp: Long?,
        hasLocalSnapshot: Boolean
    ): RefreshDecision
}

class DefaultRefreshDecisionPolicy @Inject constructor() : RefreshDecisionPolicy {
    override fun decide(
        remoteSummaryTimestamp: Long,
        localSnapshotTimestamp: Long?,
        hasLocalSnapshot: Boolean
    ): RefreshDecision {
        if (!hasLocalSnapshot || localSnapshotTimestamp == null) return RefreshDecision.FETCH_MISSING
        if (remoteSummaryTimestamp == localSnapshotTimestamp) return RefreshDecision.SKIP_EQUAL
        return if (remoteSummaryTimestamp > localSnapshotTimestamp) {
            RefreshDecision.REFRESH_REMOTE_NEWER
        } else {
            RefreshDecision.SKIP_EQUAL
        }
    }
}
