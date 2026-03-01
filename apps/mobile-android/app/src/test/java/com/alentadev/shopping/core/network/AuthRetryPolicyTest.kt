package com.alentadev.shopping.core.network

import okhttp3.Protocol
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AuthRetryPolicyTest {

    @Test
    fun `isRefreshEndpoint blocks auth refresh endpoint`() {
        assertTrue(isRefreshEndpoint("/api/auth/refresh"))
        assertFalse(isRefreshEndpoint("/api/lists"))
    }

    @Test
    fun `shouldAttemptRefresh allows first 401 when request is allowed by default preset`() {
        val request = request(method = "GET", path = "/api/lists")
        val response = response(code = 401, request = request)

        val result = shouldAttemptRefresh(request, response)

        assertTrue(result)
    }

    @Test
    fun `shouldAttemptRefresh blocks second 401 in same chain`() {
        val request = request(method = "GET", path = "/api/lists")
        val firstResponse = response(code = 401, request = request)
        val secondResponse = response(code = 401, request = request, prior = firstResponse)

        val result = shouldAttemptRefresh(request, secondResponse)

        assertFalse(result)
    }

    @Test
    fun `shouldAttemptRefresh strict preset disables retry for safe routes`() {
        val request = request(method = "GET", path = "/api/lists")
        val response = response(code = 401, request = request)

        val result = shouldAttemptRefresh(
            request = request,
            response = response,
            preset = AuthRetryPolicyPreset.STRICT
        )

        assertFalse(result)
    }

    private fun request(method: String, path: String): Request =
        Request.Builder()
            .url("https://example.com$path")
            .method(method, methodBody(method))
            .build()

    private fun response(code: Int, request: Request, prior: Response? = null): Response {
        val builder = Response.Builder()
            .request(request)
            .protocol(Protocol.HTTP_1_1)
            .code(code)
            .message("test")

        prior?.let {
            builder.priorResponse(
                it.newBuilder()
                    .body(null)
                    .build()
            )
        }

        return builder.build()
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
