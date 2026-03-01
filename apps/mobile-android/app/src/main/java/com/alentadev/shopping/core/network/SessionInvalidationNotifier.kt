package com.alentadev.shopping.core.network

import javax.inject.Inject
import javax.inject.Singleton

interface SessionInvalidationNotifier {
    suspend fun notifySessionInvalidated()
}

@Singleton
class CookieClearingSessionInvalidationNotifier @Inject constructor(
    private val cookieJar: PersistentCookieJar
) : SessionInvalidationNotifier {
    override suspend fun notifySessionInvalidated() {
        cookieJar.clear()
    }
}
