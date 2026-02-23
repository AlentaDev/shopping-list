package com.alentadev.shopping.core.network

import android.util.Log
import com.alentadev.shopping.feature.auth.data.remote.AuthApi
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

private const val TAG = "TokenAuthenticator"
private const val AUTH_REFRESH_PATH = "/api/auth/refresh"
private val SAFE_METHODS = setOf("GET", "HEAD", "OPTIONS")

/**
 * Authenticator que refresca automáticamente el token cuando recibe 401.
 *
 * Política actual (alineada con web):
 * - Solo reintenta en rutas de lectura seguras.
 * - Nunca intenta refrescar el propio endpoint de refresh.
 * - Hace single-flight del refresh para evitar múltiples refresh concurrentes.
 */
class TokenAuthenticator(
    private val cookieJar: PersistentCookieJar,
    private val authApiProvider: () -> AuthApi
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        // Solo actuar en 401 Unauthorized
        if (response.code != 401) {
            Log.d(TAG, "Response no es 401, ignorando: ${response.code}")
            return null
        }

        // Evitar loops infinitos (máximo 2 intentos)
        if (responseCount(response) >= 2) {
            Log.w(TAG, "Máximo de reintentos alcanzado, limpiando cookies")
            cookieJar.clear()
            return null
        }

        val path = response.request.url.encodedPath

        // Evitar refresh del refresh
        if (path == AUTH_REFRESH_PATH) {
            Log.w(TAG, "Refresh falló, limpiando cookies")
            cookieJar.clear()
            return null
        }

        // Política SAFE: no reintentar automáticamente requests no seguras
        if (!shouldRetryOnAuth401(response.request)) {
            Log.d(TAG, "401 en request no segura (${response.request.method} $path), sin auto-refresh")
            return null
        }

        return if (refreshSessionSingleFlight()) {
            Log.d(TAG, "Token refrescado, reintentando request original")
            response.request.newBuilder().build()
        } else {
            Log.w(TAG, "No se pudo refrescar token, limpiando cookies")
            cookieJar.clear()
            null
        }
    }

    private fun shouldRetryOnAuth401(request: Request): Boolean {
        val method = request.method.uppercase()
        if (!SAFE_METHODS.contains(method)) {
            return false
        }

        val path = request.url.encodedPath
        return path == "/api/lists" ||
            path.startsWith("/api/lists/") ||
            path == "/api/lists/autosave" ||
            path == "/api/users/me"
    }

    private fun refreshSessionSingleFlight(): Boolean {
        synchronized(refreshLock) {
            if (refreshInProgress) {
                while (refreshInProgress) {
                    try {
                        refreshLock.wait()
                    } catch (ie: InterruptedException) {
                        Thread.currentThread().interrupt()
                        return false
                    }
                }
                return lastRefreshSucceeded
            }

            refreshInProgress = true
        }

        val refreshSucceeded = try {
            Log.d(TAG, "Token expirado (401), refrescando...")
            val authApi = authApiProvider()
            runBlocking {
                authApi.refreshToken()
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "Error al refrescar token: ${e.message}", e)
            false
        }

        synchronized(refreshLock) {
            lastRefreshSucceeded = refreshSucceeded
            refreshInProgress = false
            refreshLock.notifyAll()
        }

        return refreshSucceeded
    }

    /**
     * Cuenta cuántos intentos de refresh se han hecho
     * para evitar loops infinitos
     */
    private fun responseCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) {
            count++
            prior = prior.priorResponse
        }
        return count
    }

    internal companion object {
        private val refreshLock = Object()

        @Volatile
        private var refreshInProgress: Boolean = false

        @Volatile
        private var lastRefreshSucceeded: Boolean = false

        fun resetStateForTests() {
            synchronized(refreshLock) {
                refreshInProgress = false
                lastRefreshSucceeded = false
            }
        }
    }
}
