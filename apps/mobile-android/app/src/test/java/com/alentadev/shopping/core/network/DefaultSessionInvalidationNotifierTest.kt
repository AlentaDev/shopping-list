package com.alentadev.shopping.core.network

import kotlinx.coroutines.test.runTest
import org.junit.Test

class DefaultSessionInvalidationNotifierTest {

    @Test
    fun `notifySessionInvalidated completes without side effects`() = runTest {
        val notifier = DefaultSessionInvalidationNotifier()

        notifier.notifySessionInvalidated()
    }
}
