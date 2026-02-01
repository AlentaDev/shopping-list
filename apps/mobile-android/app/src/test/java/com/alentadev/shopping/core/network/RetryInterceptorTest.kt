package com.alentadev.shopping.core.network

import io.mockk.every
import io.mockk.mockk
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import org.junit.Assert.*
import org.junit.Test

class RetryInterceptorTest {

    @Test
    fun `succeeds on first attempt`() {
        // Arrange
        val chain = mockk<Interceptor.Chain>()
        val request = mockk<Request>()
        val response = mockk<Response>(relaxed = true)

        every { chain.request() } returns request
        every { chain.proceed(request) } returns response

        val retryInterceptor = RetryInterceptor()

        // Act
        val result = retryInterceptor.intercept(chain)

        // Assert
        assertEquals(response, result)
    }
}
