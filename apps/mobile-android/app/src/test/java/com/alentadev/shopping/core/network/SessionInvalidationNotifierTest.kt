package com.alentadev.shopping.core.network

import com.alentadev.shopping.feature.sync.application.SyncCoordinator
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.Test

class SessionInvalidationNotifierTest {

    @Test
    fun `notifySessionInvalidated cancels sync and clears cookies`() = runTest {
        val cookieJar = mockk<PersistentCookieJar>(relaxed = true)
        val syncCoordinator = mockk<SyncCoordinator>(relaxed = true)
        val notifier = CookieClearingSessionInvalidationNotifier(cookieJar, syncCoordinator)

        notifier.notifySessionInvalidated()

        verify(exactly = 1) { syncCoordinator.cancel() }
        verify(exactly = 1) { cookieJar.clear() }
    }
}
