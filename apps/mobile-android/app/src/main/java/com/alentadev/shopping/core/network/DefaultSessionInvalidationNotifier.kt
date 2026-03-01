package com.alentadev.shopping.core.network

import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow

@Singleton
class DefaultSessionInvalidationNotifier @Inject constructor() : SessionInvalidationNotifier {
    private val _events = MutableSharedFlow<Unit>(
        replay = 0,
        extraBufferCapacity = 1
    )

    override val events: Flow<Unit> = _events.asSharedFlow()

    override fun notifySessionInvalidated() {
        _events.tryEmit(Unit)
    }
}
