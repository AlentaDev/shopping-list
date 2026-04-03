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
        Log.d(TAG, "  ✅ 401 eligible for refresh")

        if (isRefreshEndpoint(request.url.encodedPath)) {
            Log.d(TAG, "  ❌ refresh skipped due to loop protection (refresh endpoint)")
            return false
        }

        if (hasRetryMarkerHeader(request)) {
            Log.d(TAG, "  ❌ refresh skipped due to loop protection (retry marker present)")
            return false
        }

        if (hasPriorRefreshAttempt(response)) {
            Log.d(TAG, "  ❌ refresh skipped due to loop protection (prior response detected)")
            return false
        }

        val normalizedPath = normalizePath(request.url.encodedPath)
        if (isListsCompleteEndpoint(request.method, normalizedPath)) {
            Log.d(TAG, "  ✅ 401 eligible for refresh (lists complete exception)")
        }
        return true
    }
}

private const val AUTH_REFRESH_ENDPOINT = "/api/auth/refresh"
const val AUTH_RETRY_MARKER_HEADER = "X-Auth-Retry"
const val AUTH_RETRY_MARKER_VALUE = "1"

fun isRefreshEndpoint(path: String): Boolean {
    val normalizedPath = normalizePath(path)
    return normalizedPath == AUTH_REFRESH_ENDPOINT
}

private fun hasPriorRefreshAttempt(response: Response): Boolean = response.priorResponse != null

private fun hasRetryMarkerHeader(request: Request): Boolean =
    request.header(AUTH_RETRY_MARKER_HEADER) == AUTH_RETRY_MARKER_VALUE

private fun isListsCompleteEndpoint(method: String, path: String): Boolean {
    val normalizedMethod = method.uppercase()
    return normalizedMethod == "POST" && Regex("^/api/lists/[^/]+/complete$").matches(path)
}

private fun normalizePath(pathOrUrl: String): String {
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        return java.net.URI.create(pathOrUrl).path ?: "/"
    }

    return pathOrUrl
}
