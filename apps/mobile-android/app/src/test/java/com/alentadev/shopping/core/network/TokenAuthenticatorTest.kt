package com.alentadev.shopping.core.network

import io.mockk.coEvery
import io.mockk.coVerify
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
    private val refreshCoordinator = mockk<RefreshCoordinator>()

    @Test
    fun `authenticate returns null for non-401 responses`() {
        val authenticator = TokenAuthenticator(cookieJar, refreshCoordinator)
        val response = response(code = 500, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 0) { refreshCoordinator.refresh() }
        coVerify(exactly = 0) { cookieJar.clear() }
    }

    @Test
    fun `successful refresh retries original request`() {
        coEvery { refreshCoordinator.refresh() } returns RefreshCoordinator.Result.SUCCESS
        val authenticator = TokenAuthenticator(cookieJar, refreshCoordinator)
        val response = response(code = 401, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNotNull(result)
        assertEquals("/api/lists", result?.url?.encodedPath)
        assertEquals("GET", result?.method)
        coVerify(exactly = 1) { refreshCoordinator.refresh() }
        coVerify(exactly = 0) { cookieJar.clear() }
    }

    @Test
    fun `second 401 in chain is blocked by policy`() {
        val authenticator = TokenAuthenticator(cookieJar, refreshCoordinator)
        val first = response(code = 401, method = "GET", path = "/api/lists")
        val second = response(code = 401, method = "GET", path = "/api/lists", prior = first)

        val result = authenticator.authenticate(null, second)

        assertNull(result)
        coVerify(exactly = 0) { refreshCoordinator.refresh() }
        coVerify(exactly = 0) { cookieJar.clear() }
    }

    @Test
    fun `refresh endpoint 401 does not recurse`() {
        val authenticator = TokenAuthenticator(cookieJar, refreshCoordinator)
        val response = response(code = 401, method = "POST", path = "/api/auth/refresh")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 0) { refreshCoordinator.refresh() }
        coVerify(exactly = 0) { cookieJar.clear() }
    }

    @Test
    fun `refresh unauthorized clears cookies and returns null`() {
        coEvery { refreshCoordinator.refresh() } returns RefreshCoordinator.Result.FAILED_UNAUTHORIZED
        val authenticator = TokenAuthenticator(cookieJar, refreshCoordinator)
        val response = response(code = 401, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 1) { refreshCoordinator.refresh() }
        coVerify(exactly = 1) { cookieJar.clear() }
    }

    @Test
    fun `refresh network failure returns null without clearing cookies`() {
        coEvery { refreshCoordinator.refresh() } returns RefreshCoordinator.Result.FAILED_NETWORK
        val authenticator = TokenAuthenticator(cookieJar, refreshCoordinator)
        val response = response(code = 401, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 1) { refreshCoordinator.refresh() }
        coVerify(exactly = 0) { cookieJar.clear() }
    }

    private fun response(code: Int, method: String, path: String, prior: Response? = null): Response {
        val request = Request.Builder()
            .url("https://example.com$path")
            .method(method, methodBody(method))
            .build()

        // Para crear prior response válido, OkHttp requiere estructura específica
        val responseBuilder = Response.Builder()
            .request(request)
            .protocol(Protocol.HTTP_1_1)
            .code(code)
            .message("test")

        // Si hay prior, debe estar correctamente formado (OkHttp internals)
        prior?.let {
            try {
                responseBuilder.priorResponse(
                    it.newBuilder()
                        .body(null) // Prior response no debe tener body
                        .build()
                )
            } catch (e: Exception) {
                // Si falla, construir prior simple
                responseBuilder.priorResponse(
                    Response.Builder()
                        .request(it.request)
                        .protocol(Protocol.HTTP_1_1)
                        .code(it.code)
                        .message("prior")
                        .build()
                )
            }
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
