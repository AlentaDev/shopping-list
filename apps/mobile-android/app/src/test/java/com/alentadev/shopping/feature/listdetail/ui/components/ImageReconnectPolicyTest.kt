package com.alentadev.shopping.feature.listdetail.ui.components

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ImageReconnectPolicyTest {
    @Test
    fun retriesOnlyWhenConnectionReturnsAfterAnImageFailure() {
        assertTrue(shouldRetryImageOnReconnect(wasConnected = false, isConnected = true, imageFailed = true))
        assertFalse(shouldRetryImageOnReconnect(wasConnected = false, isConnected = true, imageFailed = false))
        assertFalse(shouldRetryImageOnReconnect(wasConnected = true, isConnected = true, imageFailed = true))
        assertFalse(shouldRetryImageOnReconnect(wasConnected = true, isConnected = false, imageFailed = true))
    }

    @Test
    fun lateFailureAfterReconnectRetriesOnceAndDoesNotLoopOnline() {
        val retryState = ImageReconnectRetryState(initiallyConnected = false)
        val requestGeneration = retryState.requestStarted()

        assertFalse(retryState.connectivityChanged(now = true))
        assertTrue(retryState.requestFailed(requestGeneration, now = true))
        val retryGeneration = retryState.requestStarted()
        assertFalse(retryState.requestFailed(retryGeneration, now = true))
    }

    @Test
    fun failedOfflineRequestStillRetriesWhenConnectionReturns() {
        val retryState = ImageReconnectRetryState(initiallyConnected = false)
        val requestGeneration = retryState.requestStarted()

        assertFalse(retryState.requestFailed(requestGeneration, now = false))
        assertTrue(retryState.connectivityChanged(now = true))
    }

    @Test
    fun cacheIdentityRemainsStableAcrossConnectivityTransitions() {
        val url = "https://example.test/product.png"
        assertTrue(imageCacheKey(url, isConnected = false) == imageCacheKey(url, isConnected = true))
    }
}
