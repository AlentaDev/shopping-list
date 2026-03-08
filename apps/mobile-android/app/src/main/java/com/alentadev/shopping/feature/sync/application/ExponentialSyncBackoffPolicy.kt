package com.alentadev.shopping.feature.sync.application

import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.min

@Singleton
class ExponentialSyncBackoffPolicy @Inject constructor() : SyncBackoffPolicy {
    override fun delayMillisFor(retryCount: Int): Long {
        val safeRetryCount = retryCount.coerceAtLeast(1)
        val exponential = 1_000L * (1L shl (safeRetryCount - 1).coerceAtMost(10))
        return min(exponential, 60_000L)
    }
}
