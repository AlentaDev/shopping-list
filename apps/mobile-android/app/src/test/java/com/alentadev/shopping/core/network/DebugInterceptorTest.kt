package com.alentadev.shopping.core.network

import io.mockk.every
import io.mockk.mockk
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DebugInterceptorTest {

    @Test
    fun `verbose mode logs request url headers and body details`() {
        val logs = mutableListOf<String>()
        val interceptor = DebugInterceptor(
            mode = DebugLogMode.VERBOSE,
            clock = { 1_000L },
            logger = NetworkLogSink { _, _, message -> logs += message }
        )
        val request = request()
        val response = response(request)
        val chain = mockk<Interceptor.Chain>()

        every { chain.request() } returns request
        every { chain.proceed(request) } returns response

        interceptor.intercept(chain)

        val joinedLogs = logs.joinToString("\n")
        assertTrue(joinedLogs.contains("URL: https://api-shopping-list.onrender.com/api/lists/123/items"))
        assertTrue(joinedLogs.contains("Authorization: Bearer top-secret"))
        assertTrue(joinedLogs.contains("Cookie: session=abc123"))
        assertTrue(joinedLogs.contains("Body:"))
    }

    @Test
    fun `safe metadata mode omits secrets payloads and personal paths`() {
        val logs = mutableListOf<String>()
        val interceptor = DebugInterceptor(
            mode = DebugLogMode.SAFE_METADATA,
            clock = object {
                private var now = 1_000L
                fun next() = now.also { now += 25L }
            }::next,
            logger = NetworkLogSink { _, _, message -> logs += message }
        )
        val request = request()
        val response = response(request)
        val chain = mockk<Interceptor.Chain>()

        every { chain.request() } returns request
        every { chain.proceed(request) } returns response

        interceptor.intercept(chain)

        val joinedLogs = logs.joinToString("\n")
        assertTrue(joinedLogs.contains("Method: POST"))
        assertTrue(joinedLogs.contains("Host: api-shopping-list.onrender.com"))
        assertTrue(joinedLogs.contains("Status: 200"))
        assertFalse(joinedLogs.contains("Authorization"))
        assertFalse(joinedLogs.contains("top-secret"))
        assertFalse(joinedLogs.contains("Cookie"))
        assertFalse(joinedLogs.contains("session=abc123"))
        assertFalse(joinedLogs.contains("Set-Cookie"))
        assertFalse(joinedLogs.contains("milk"))
        assertFalse(joinedLogs.contains("/api/lists/123/items"))
        assertFalse(joinedLogs.contains("Body:"))
    }

    private fun request(): Request = Request.Builder()
        .url("https://api-shopping-list.onrender.com/api/lists/123/items")
        .header("Authorization", "Bearer top-secret")
        .header("Cookie", "session=abc123")
        .post("{".plus("\"name\":\"milk\"}").toRequestBody("application/json".toMediaType()))
        .build()

    private fun response(request: Request): Response = Response.Builder()
        .request(request)
        .protocol(Protocol.HTTP_1_1)
        .code(200)
        .message("OK")
        .header("Set-Cookie", "session=rotated")
        .body("{\"ok\":true}".toResponseBody("application/json".toMediaType()))
        .build()
}
