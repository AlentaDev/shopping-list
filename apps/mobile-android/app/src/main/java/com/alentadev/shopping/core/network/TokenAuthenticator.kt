package com.alentadev.shopping.core.network

import android.util.Log
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route

private const val TAG = "TokenAuthenticator"

class TokenAuthenticator(private val cookieJar: PersistentCookieJar) : Authenticator {
    private val refreshClient: OkHttpClient = OkHttpClient.Builder()
        .cookieJar(cookieJar)
        .build()

    override fun authenticate(route: Route?, response: Response): Request? {
        if (response.code != 401) return null
        if (responseCount(response) >= 2) return null
        if (response.request.url.encodedPath.endsWith("/api/auth/refresh")) return null

        return try {
            val refreshUrl = response.request.url.newBuilder()
                .encodedPath("/api/auth/refresh")
                .build()

            val refreshRequest = Request.Builder()
                .url(refreshUrl)
                .post("".toRequestBody("application/json".toMediaType()))
                .build()

            val refreshResponse = refreshClient.newCall(refreshRequest).execute()
            refreshResponse.use {
                if (it.isSuccessful) {
                    // CookieJar ya recibió Set-Cookie, reintentar request original.
                    response.request.newBuilder().build()
                } else {
                    cookieJar.clear()
                    null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error al refrescar token", e)
            cookieJar.clear()
            null
        }
    }

    private fun responseCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) {
            count++
            prior = prior.priorResponse
        }
        return count
    }
}
