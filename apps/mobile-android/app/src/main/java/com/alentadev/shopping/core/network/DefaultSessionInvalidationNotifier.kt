package com.alentadev.shopping.core.network

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DefaultSessionInvalidationNotifier @Inject constructor() : SessionInvalidationNotifier {
    override suspend fun notifySessionInvalidated() = Unit
}
