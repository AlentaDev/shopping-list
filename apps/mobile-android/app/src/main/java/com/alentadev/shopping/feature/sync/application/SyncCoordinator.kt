package com.alentadev.shopping.feature.sync.application

interface SyncCoordinator {
    fun startForAuthenticatedSession()
    fun cancel()
}
