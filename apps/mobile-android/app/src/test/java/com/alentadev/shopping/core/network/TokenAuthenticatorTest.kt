package com.alentadev.shopping.core.network

import com.alentadev.shopping.feature.auth.data.remote.AuthApi
import io.mockk.coVerify
import io.mockk.mockk
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.junit.Assert.assertNull
import org.junit.Test

class TokenAuthenticatorTest {

    private val cookieJar = mockk<PersistentCookieJar>(relaxed = true)
    private val authApi = mockk<AuthApi>(relaxed = true)

    @Test
    fun `authenticate returns null for non-401 responses`() {
        val authenticator = TokenAuthenticator(cookieJar) { authApi }
        val response = response(code = 500, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 0) { authApi.refreshToken() }
        coVerify(exactly = 0) { cookieJar.clear() }
    }

    @Test
    fun `authenticate returns null for 401 and never calls refresh endpoint`() {
        val authenticator = TokenAuthenticator(cookieJar) { authApi }
        val response = response(code = 401, method = "GET", path = "/api/lists")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 0) { authApi.refreshToken() }
        coVerify(exactly = 0) { cookieJar.clear() }
    }

    @Test
    fun `authenticate returns null for refresh endpoint 401 without clearing cookies`() {
        val authenticator = TokenAuthenticator(cookieJar) { authApi }
        val response = response(code = 401, method = "POST", path = "/api/auth/refresh")

        val result = authenticator.authenticate(null, response)

        assertNull(result)
        coVerify(exactly = 0) { authApi.refreshToken() }
        coVerify(exactly = 0) { cookieJar.clear() }
    }

    private fun response(code: Int, method: String, path: String, prior: Response? = null): Response {
        val request = Request.Builder()
            .url("https://example.com$path")
            .method(method, methodBody(method))
            .build()

        return Response.Builder()
            .request(request)
            .protocol(Protocol.HTTP_1_1)
            .code(code)
            .message("test")
            .apply {
                if (prior != null) {
                    priorResponse(prior)
                }
            }
            .build()
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
