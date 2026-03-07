package com.alentadev.shopping.core.network

import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.IOException

class RetryInterceptorTest {

    @Test
    fun `succeeds on first attempt`() {
        val chain = mockk<Interceptor.Chain>()
        val request = mockk<Request>()
        val response = mockk<Response>(relaxed = true)
        val connectivityGate = mockk<ConnectivityGate>()

        every { chain.request() } returns request
        every { chain.proceed(request) } returns response
        every { connectivityGate.isOnline() } returns true

        val retryInterceptor = RetryInterceptor(connectivityGate, sleep = {})

        val result = retryInterceptor.intercept(chain)

        assertEquals(response, result)
        verify(exactly = 1) { chain.proceed(request) }
    }

    @Test
    fun `offline after first network error skips retries and rethrows immediately`() {
        val chain = mockk<Interceptor.Chain>()
        val request = mockk<Request>()
        val connectivityGate = mockk<ConnectivityGate>()
        val exception = IOException("network down")

        every { chain.request() } returns request
        every { chain.proceed(request) } throws exception
        every { connectivityGate.isOnline() } returns false

        val retryInterceptor = RetryInterceptor(connectivityGate, sleep = {})

        val thrown = runCatching { retryInterceptor.intercept(chain) }.exceptionOrNull()

        assertSame(exception, thrown)
        verify(exactly = 1) { chain.proceed(request) }
        verify(exactly = 1) { connectivityGate.isOnline() }
    }

    @Test
    fun `offline before first attempt fails fast without hitting chain`() {
        val chain = mockk<Interceptor.Chain>()
        val connectivityGate = mockk<ConnectivityGate>()

        every { connectivityGate.isOnline() } returns false

        val retryInterceptor = RetryInterceptor(connectivityGate, sleep = {})

        val thrown = runCatching { retryInterceptor.intercept(chain) }.exceptionOrNull()

        assertTrue(thrown is IOException)
        assertEquals("No network available", thrown?.message)
        verify(exactly = 0) { chain.request() }
        verify(exactly = 1) { connectivityGate.isOnline() }
    }

    @Test
    fun `online transient ioexception retries until success`() {
        val chain = mockk<Interceptor.Chain>()
        val request = mockk<Request>()
        val response = mockk<Response>(relaxed = true)
        val connectivityGate = mockk<ConnectivityGate>()
        val ioException = IOException("timeout")

        every { chain.request() } returns request
        every { chain.proceed(request) } throws ioException andThenThrows ioException andThen response
        every { connectivityGate.isOnline() } returns true

        val retryInterceptor = RetryInterceptor(connectivityGate, sleep = {})

        val result = retryInterceptor.intercept(chain)

        assertEquals(response, result)
        verify(exactly = 3) { chain.proceed(request) }
        verify(exactly = 2) { connectivityGate.isOnline() }
    }

    @Test
    fun `non ioexception is rethrown without retries`() {
        val chain = mockk<Interceptor.Chain>()
        val request = mockk<Request>()
        val connectivityGate = mockk<ConnectivityGate>()
        val exception = IllegalStateException("boom")

        every { chain.request() } returns request
        every { chain.proceed(request) } throws exception

        val retryInterceptor = RetryInterceptor(connectivityGate, sleep = {})

        val thrown = runCatching { retryInterceptor.intercept(chain) }.exceptionOrNull()

        assertSame(exception, thrown)
        verify(exactly = 1) { chain.proceed(request) }
        verify(exactly = 0) { connectivityGate.isOnline() }
    }
}
