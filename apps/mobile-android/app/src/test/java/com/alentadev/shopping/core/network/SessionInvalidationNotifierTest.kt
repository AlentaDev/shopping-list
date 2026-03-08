package com.alentadev.shopping.core.network

import com.alentadev.shopping.feature.auth.domain.session.SessionWarmUpOrchestrator
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.Test

class SessionInvalidationNotifierTest {

    @Test
    fun `notifySessionInvalidated cancels warm-up and clears cookies`() = runTest {
        val cookieJar = mockk<PersistentCookieJar>(relaxed = true)
        val orchestrator = mockk<SessionWarmUpOrchestrator>(relaxed = true)
        val notifier = CookieClearingSessionInvalidationNotifier(cookieJar, orchestrator)

        notifier.notifySessionInvalidated()

        verify(exactly = 1) { orchestrator.cancelWarmUp() }
        verify(exactly = 1) { cookieJar.clear() }
    }
}
