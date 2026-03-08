package com.alentadev.shopping.core.network

import com.alentadev.shopping.feature.sync.application.SyncCoordinator
import javax.inject.Inject
import javax.inject.Singleton

interface SessionInvalidationNotifier {
    suspend fun notifySessionInvalidated()
}

@Singleton
class CookieClearingSessionInvalidationNotifier @Inject constructor(
    private val cookieJar: PersistentCookieJar,
    private val syncCoordinator: SyncCoordinator
) : SessionInvalidationNotifier {
    override suspend fun notifySessionInvalidated() {
        syncCoordinator.cancel()
        cookieJar.clear()
    }
}
