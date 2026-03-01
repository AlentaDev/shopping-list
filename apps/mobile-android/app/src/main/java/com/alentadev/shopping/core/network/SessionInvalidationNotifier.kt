package com.alentadev.shopping.core.network

import kotlinx.coroutines.flow.Flow

interface SessionInvalidationNotifier {
    val events: Flow<Unit>

    fun notifySessionInvalidated()
}
