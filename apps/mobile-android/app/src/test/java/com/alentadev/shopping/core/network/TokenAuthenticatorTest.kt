package com.alentadev.shopping.core.network

import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class TokenAuthenticatorTest {

    private val authRetryPolicy = mockk<AuthRetryPolicy>()
    private val refreshCoordinator = mockk<RefreshCoordinator>()
    private val sessionInvalidationNotifier = mockk<SessionInvalidationNotifier>(relaxed = true)
    private val authCredentialProvider = mockk<AuthCredentialProvider>()

    @Test
    fun `authenticate returns null when policy blocks refresh`() {
        every { authRetryPolicy.shouldAttemptRefresh(any(), any()) } returns false
        val authenticator = TokenAuthenticator(
            authRetryPolicy,
            refreshCoordinator,
            sessionInvalidationNotifier,
            authCredentialProvider
        )
        val response = response(code = 500, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 0) { refreshCoordinator.refresh() }
        coVerify(exactly = 0) { sessionInvalidationNotifier.notifySessionInvalidated() }
        verify(exactly = 0) { authCredentialProvider.hasCredentials(any()) }
    }

    @Test
    fun `successful refresh retries original request`() {
        every { authRetryPolicy.shouldAttemptRefresh(any(), any()) } returns true
        every { authCredentialProvider.hasCredentials(any()) } returnsMany listOf(true, true)
        every { authCredentialProvider.buildCookieHeader(any()) } returns "access_token=rotated"
        coEvery { refreshCoordinator.refresh() } returns RefreshCoordinator.Result.SUCCESS
        val authenticator = TokenAuthenticator(
            authRetryPolicy,
            refreshCoordinator,
            sessionInvalidationNotifier,
            authCredentialProvider
        )
        val response = response(code = 401, method = "POST", path = "/api/lists")

        val result = authenticator.authenticate(null, response)
        val finalResponse = result?.let { retriedRequest ->
            response(code = 200, method = retriedRequest.method, path = retriedRequest.url.encodedPath)
        }

        assertNotNull(result)
        assertEquals("/api/lists", result?.url?.encodedPath)
        assertEquals("POST", result?.method)
        assertEquals(AUTH_RETRY_MARKER_VALUE, result?.header(AUTH_RETRY_MARKER_HEADER))
        assertEquals("access_token=rotated", result?.header("Cookie"))
        assertEquals(200, finalResponse?.code)
        coVerify(exactly = 1) { refreshCoordinator.refresh() }
        coVerify(exactly = 0) { sessionInvalidationNotifier.notifySessionInvalidated() }
        verify(exactly = 2) { authCredentialProvider.hasCredentials(any()) }
        verify(exactly = 1) { authCredentialProvider.buildCookieHeader(any()) }
    }

    @Test
    fun `refresh unauthorized triggers session invalidation and returns null`() {
        every { authRetryPolicy.shouldAttemptRefresh(any(), any()) } returns true
        every { authCredentialProvider.hasCredentials(any()) } returns false
        coEvery { refreshCoordinator.refresh() } returns RefreshCoordinator.Result.FAILED_UNAUTHORIZED
        val authenticator = TokenAuthenticator(
            authRetryPolicy,
            refreshCoordinator,
            sessionInvalidationNotifier,
            authCredentialProvider
        )
        val response = response(code = 401, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 1) { refreshCoordinator.refresh() }
        coVerify(exactly = 1) { sessionInvalidationNotifier.notifySessionInvalidated() }
        verify(exactly = 1) { authCredentialProvider.hasCredentials(any()) }
    }

    @Test
    fun `refresh network failure returns null without invalidating session`() {
        every { authRetryPolicy.shouldAttemptRefresh(any(), any()) } returns true
        every { authCredentialProvider.hasCredentials(any()) } returns false
        coEvery { refreshCoordinator.refresh() } returns RefreshCoordinator.Result.FAILED_NETWORK
        val authenticator = TokenAuthenticator(
            authRetryPolicy,
            refreshCoordinator,
            sessionInvalidationNotifier,
            authCredentialProvider
        )
        val response = response(code = 401, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 1) { refreshCoordinator.refresh() }
        coVerify(exactly = 0) { sessionInvalidationNotifier.notifySessionInvalidated() }
        verify(exactly = 1) { authCredentialProvider.hasCredentials(any()) }
        verify(exactly = 0) { authCredentialProvider.buildCookieHeader(any()) }
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
