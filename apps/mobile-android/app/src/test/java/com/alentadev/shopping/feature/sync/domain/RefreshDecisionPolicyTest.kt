package com.alentadev.shopping.feature.sync.domain

import org.junit.Assert.assertEquals
import org.junit.Test

class RefreshDecisionPolicyTest {

    private val policy = DefaultRefreshDecisionPolicy()

    @Test
    fun `decide returns FETCH_MISSING when local snapshot is missing`() {
        val result = policy.decide(
            remoteSummaryTimestamp = 200L,
            localSnapshotTimestamp = null,
            hasLocalSnapshot = false
        )

        assertEquals(RefreshDecision.FETCH_MISSING, result)
    }

    @Test
    fun `decide returns SKIP_EQUAL when timestamps are equal`() {
        val result = policy.decide(
            remoteSummaryTimestamp = 200L,
            localSnapshotTimestamp = 200L,
            hasLocalSnapshot = true
        )

        assertEquals(RefreshDecision.SKIP_EQUAL, result)
    }

    @Test
    fun `decide returns REFRESH_REMOTE_NEWER when remote timestamp is newer`() {
        val result = policy.decide(
            remoteSummaryTimestamp = 300L,
            localSnapshotTimestamp = 200L,
            hasLocalSnapshot = true
        )

        assertEquals(RefreshDecision.REFRESH_REMOTE_NEWER, result)
    }
}
