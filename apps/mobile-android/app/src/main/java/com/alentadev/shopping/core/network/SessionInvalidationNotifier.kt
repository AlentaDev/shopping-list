package com.alentadev.shopping.core.network

import com.alentadev.shopping.feature.auth.domain.session.SessionWarmUpOrchestrator
import javax.inject.Inject
import javax.inject.Singleton

interface SessionInvalidationNotifier {
    suspend fun notifySessionInvalidated()
}

@Singleton
class CookieClearingSessionInvalidationNotifier @Inject constructor(
    private val cookieJar: PersistentCookieJar,
    private val sessionWarmUpOrchestrator: SessionWarmUpOrchestrator
) : SessionInvalidationNotifier {
    override suspend fun notifySessionInvalidated() {
        sessionWarmUpOrchestrator.cancelWarmUp()
        cookieJar.clear()
    }
}
