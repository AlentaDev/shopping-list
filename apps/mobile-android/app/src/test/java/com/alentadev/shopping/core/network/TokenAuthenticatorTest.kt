package com.alentadev.shopping.core.network

import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class TokenAuthenticatorTest {

    private val cookieJar = mockk<PersistentCookieJar>(relaxed = true)
    private val authRetryPolicy = mockk<AuthRetryPolicy>()
    private val refreshCoordinator = mockk<RefreshCoordinator>()
    private val sessionInvalidationNotifier = mockk<SessionInvalidationNotifier>(relaxed = true)

    @Test
    fun `authenticate returns null when policy blocks refresh`() {
        every { authRetryPolicy.shouldAttemptRefresh(any(), any()) } returns false
        val authenticator = TokenAuthenticator(
            cookieJar,
            authRetryPolicy,
            refreshCoordinator,
            sessionInvalidationNotifier
        )
        val response = response(code = 500, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 0) { refreshCoordinator.refresh() }
        coVerify(exactly = 0) { sessionInvalidationNotifier.notifySessionInvalidated() }
    }

    @Test
    fun `successful refresh retries original request`() {
        every { authRetryPolicy.shouldAttemptRefresh(any(), any()) } returns true
        coEvery { refreshCoordinator.refresh() } returns RefreshCoordinator.Result.SUCCESS
        val authenticator = TokenAuthenticator(
            cookieJar,
            authRetryPolicy,
            refreshCoordinator,
            sessionInvalidationNotifier
        )
        val response = response(code = 401, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNotNull(result)
        assertEquals("/api/lists", result?.url?.encodedPath)
        assertEquals("GET", result?.method)
        coVerify(exactly = 1) { refreshCoordinator.refresh() }
        coVerify(exactly = 0) { sessionInvalidationNotifier.notifySessionInvalidated() }
    }

    @Test
    fun `refresh unauthorized triggers session invalidation and returns null`() {
        every { authRetryPolicy.shouldAttemptRefresh(any(), any()) } returns true
        coEvery { refreshCoordinator.refresh() } returns RefreshCoordinator.Result.FAILED_UNAUTHORIZED
        val authenticator = TokenAuthenticator(
            cookieJar,
            authRetryPolicy,
            refreshCoordinator,
            sessionInvalidationNotifier
        )
        val response = response(code = 401, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 1) { refreshCoordinator.refresh() }
        coVerify(exactly = 1) { sessionInvalidationNotifier.notifySessionInvalidated() }
    }

    @Test
    fun `refresh network failure returns null without invalidating session`() {
        every { authRetryPolicy.shouldAttemptRefresh(any(), any()) } returns true
        coEvery { refreshCoordinator.refresh() } returns RefreshCoordinator.Result.FAILED_NETWORK
        val authenticator = TokenAuthenticator(
            cookieJar,
            authRetryPolicy,
            refreshCoordinator,
            sessionInvalidationNotifier
        )
        val response = response(code = 401, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 1) { refreshCoordinator.refresh() }
        coVerify(exactly = 0) { sessionInvalidationNotifier.notifySessionInvalidated() }
    }

    private fun response(code: Int, method: String, path: String, prior: Response? = null): Response {
        val request = Request.Builder()
            .url("https://example.com$path")
            .method(method, methodBody(method))
            .build()

        val responseBuilder = Response.Builder()
            .request(request)
            .protocol(Protocol.HTTP_1_1)
            .code(code)
            .message("test")

        prior?.let {
            responseBuilder.priorResponse(
                it.newBuilder()
                    .body(null)
                    .build()
            )
        }

        return responseBuilder.build()
    }

    private fun methodBody(method: String) =
        if (
            method.equals("POST", ignoreCase = true) ||
            method.equals("PUT", ignoreCase = true) ||
            method.equals("PATCH", ignoreCase = true) ||
            method.equals("DELETE", ignoreCase = true)
        ) {
            "".toRequestBody()
        } else {
            null
        }
}
