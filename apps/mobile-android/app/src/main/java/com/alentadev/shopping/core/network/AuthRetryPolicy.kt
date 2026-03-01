package com.alentadev.shopping.core.network

import okhttp3.Request
import okhttp3.Response

private const val AUTH_REFRESH_ENDPOINT = "/api/auth/refresh"
private val SAFE_METHODS = setOf("GET", "HEAD", "OPTIONS")

enum class AuthRetryPolicyPreset {
    DEFAULT,
    STRICT
}

fun isRefreshEndpoint(path: String): Boolean {
    val normalizedPath = normalizePath(path)
    return normalizedPath == AUTH_REFRESH_ENDPOINT
}

fun shouldAttemptRefresh(
    request: Request,
    response: Response,
    preset: AuthRetryPolicyPreset = AuthRetryPolicyPreset.DEFAULT
): Boolean {
    if (response.code != 401) {
        return false
    }

    if (isRefreshEndpoint(request.url.encodedPath)) {
        return false
    }

    if (responseCount(response) >= 2) {
        return false
    }

    return when (preset) {
        AuthRetryPolicyPreset.STRICT -> false
        AuthRetryPolicyPreset.DEFAULT -> isSafeByDefault(request)
    }
}

private fun isSafeByDefault(request: Request): Boolean {
    val normalizedMethod = request.method.uppercase()
    if (!SAFE_METHODS.contains(normalizedMethod)) {
        return false
    }

    val path = normalizePath(request.url.encodedPath)
    return isSafeRetryRoute(path)
}

private fun isSafeRetryRoute(path: String): Boolean =
    isSafeListsReadRoute(path) || path == "/api/users/me"

private fun isSafeListsReadRoute(path: String): Boolean =
    path == "/api/lists" ||
        path.startsWith("/api/lists/") ||
        path == "/api/lists/autosave"

private fun normalizePath(pathOrUrl: String): String {
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
        return java.net.URI.create(pathOrUrl).path ?: "/"
    }

    return pathOrUrl
}

private fun responseCount(response: Response): Int {
    var count = 1
    var current = response.priorResponse
    while (current != null) {
        count++
        current = current.priorResponse
    }
    return count
}
