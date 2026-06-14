package com.alentadev.shopping.core.network

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.logging.HttpLoggingInterceptor

enum class DebugLogMode {
    VERBOSE,
    SAFE_METADATA
}

data class NetworkLoggingPolicy(
    val httpLoggingLevel: HttpLoggingInterceptor.Level,
    val debugLogMode: DebugLogMode
)

internal fun resolveNetworkLoggingPolicy(
    apiBaseUrl: String,
    isDebugBuild: Boolean,
    isReleaseCapable: Boolean,
    isProductionApiTarget: Boolean
): NetworkLoggingPolicy {
    validateReleaseBaseUrl(apiBaseUrl = apiBaseUrl, isReleaseCapable = isReleaseCapable)

    val requiresSafeLogging = isReleaseCapable || isProductionApiTarget

    return if (isDebugBuild && !requiresSafeLogging) {
        NetworkLoggingPolicy(HttpLoggingInterceptor.Level.BODY, DebugLogMode.VERBOSE)
    } else {
        NetworkLoggingPolicy(HttpLoggingInterceptor.Level.NONE, DebugLogMode.SAFE_METADATA)
    }
}

internal fun validateReleaseBaseUrl(apiBaseUrl: String, isReleaseCapable: Boolean) {
    if (!isReleaseCapable) return

    val host = apiBaseUrl.toHttpUrlOrNull()?.host?.lowercase()
    val isUnsafeLocalHost = isUnsafeReleaseHost(host)

    check(!isUnsafeLocalHost) {
        "Release-capable builds must not use local API base URLs"
    }
}

private fun isUnsafeReleaseHost(host: String?): Boolean {
    if (host.isNullOrBlank()) return false

    if (host in setOf("10.0.2.2", "127.0.0.1", "localhost", "::1", "host.docker.internal")) {
        return true
    }

    if (host.endsWith(".local")) return true

    val octets = host.split('.')
    if (octets.size != 4) return false

    val numbers = octets.map { it.toIntOrNull() ?: return false }
    val first = numbers[0]
    val second = numbers[1]

    return when {
        first == 10 -> true
        first == 127 -> true
        first == 192 && second == 168 -> true
        first == 172 && second in 16..31 -> true
        first == 169 && second == 254 -> true
        else -> false
    }
}
