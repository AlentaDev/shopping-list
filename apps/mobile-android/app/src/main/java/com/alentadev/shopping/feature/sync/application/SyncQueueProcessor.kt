package com.alentadev.shopping.feature.sync.application

interface SyncQueueProcessor {
    suspend fun flushPendingSync()
}
