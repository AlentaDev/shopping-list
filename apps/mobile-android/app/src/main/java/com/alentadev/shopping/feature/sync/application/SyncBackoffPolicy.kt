package com.alentadev.shopping.feature.sync.application

interface SyncBackoffPolicy {
    fun delayMillisFor(retryCount: Int): Long
}
