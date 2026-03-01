package com.alentadev.shopping.core.network

import android.util.Log
import okhttp3.Request
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

private const val TAG = "AuthRetryPolicy"

interface AuthRetryPolicy {
    fun shouldAttemptRefresh(request: Request, response: Response): Boolean
}

@Singleton
class DefaultAuthRetryPolicy @Inject constructor() : AuthRetryPolicy {
    override fun shouldAttemptRefresh(request: Request, response: Response): Boolean {
        Log.d(TAG, "🔍 shouldAttemptRefresh - URL: ${request.url}, Status: ${response.code}")

        if (response.code != 401) {
            Log.d(TAG, "  ❌ No es 401 (status=${response.code})")
            return false
        }
        Log.d(TAG, "  ✅ Es 401")

        if (isRefreshEndpoint(request.url.encodedPath)) {
            Log.d(TAG, "  ❌ Es refresh endpoint, no reintentar")
            return false
        }

        if (responseCount(response) >= 2) {
            Log.d(TAG, "  ❌ Ya hay 2+ intentos (cuenta=${responseCount(response)})")
            return false
        }
        Log.d(TAG, "  ✅ Primera vez")

        val isSafe = isSafeByDefault(request)
        Log.d(TAG, "  ${if (isSafe) "✅" else "❌"} Método ${request.method} es ${if (isSafe) "SEGURO" else "NO SEGURO"}")

        return isSafe
    }

    private fun isSafeByDefault(request: Request): Boolean {
        val normalizedMethod = request.method.uppercase()
        if (!SAFE_METHODS.contains(normalizedMethod)) {
            Log.d(TAG, "    → ${request.method} NO está en SAFE_METHODS: $SAFE_METHODS")
            return false
        }

        val path = normalizePath(request.url.encodedPath)
        val isSafeRoute = isSafeRetryRoute(path)
        Log.d(TAG, "    → Path '$path' es ${if (isSafeRoute) "SEGURO" else "NO SEGURO"}")

        return isSafeRoute
    }

    private fun isSafeRetryRoute(path: String): Boolean =
        isSafeListsReadRoute(path) || path == "/api/users/me"

    private fun isSafeListsReadRoute(path: String): Boolean =
        path == "/api/lists" ||
            path.startsWith("/api/lists/") ||
            path == "/api/lists/autosave"

    private fun responseCount(response: Response): Int {
        var count = 1
        var current = response.priorResponse
        while (current != null) {
            count++
            current = current.priorResponse
        }
        return count
    }
}

private const val AUTH_REFRESH_ENDPOINT = "/api/auth/refresh"
private val SAFE_METHODS = setOf("GET", "HEAD", "OPTIONS", "PATCH")

fun isRefreshEndpoint(path: String): Boolean {
    val normalizedPath = normalizePath(path)
    return normalizedPath == AUTH_REFRESH_ENDPOINT
}

private fun normalizePath(pathOrUrl: String): String {
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        return java.net.URI.create(pathOrUrl).path ?: "/"
    }

    return pathOrUrl
}
