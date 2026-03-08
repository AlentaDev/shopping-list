package com.alentadev.shopping.feature.sync.application

interface SyncQueueProcessor {
    suspend fun flushPendingSync()
    suspend fun hasPendingSyncOperations(): Boolean
}
