package com.alentadev.shopping.infrastructure.observability

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SentryConfigTest {
    @Test
    fun `shouldInit returns false for blank dsn`() {
        assertFalse(SentryConfig.shouldInit(""))
    }

    @Test
    fun `shouldInit returns true for non blank dsn`() {
        assertTrue(SentryConfig.shouldInit("https://abc@o1.ingest.sentry.io/1"))
    }

    @Test
    fun `resolveEnvironment maps debug and release`() {
        assertEquals("development", SentryConfig.resolveEnvironment(isDebug = true))
        assertEquals("production", SentryConfig.resolveEnvironment(isDebug = false))
    }
}
