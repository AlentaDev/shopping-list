package com.alentadev.shopping.core.network

import android.util.Log
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

private const val TAG = "TokenAuthenticator"

/**
 * Authenticator conservador.
 *
 * La API backend gestiona el refresh y emite cookies nuevas.
 * Desde Android no se fuerza llamada manual a /api/auth/refresh.
 * Ante 401 reintenta una vez la misma request para aprovechar cookies/tokens
 * potencialmente renovados por la API en la respuesta previa.
 */
class TokenAuthenticator(
    private val authRetryPolicy: AuthRetryPolicy,
    private val refreshCoordinator: RefreshCoordinator,
    private val sessionInvalidationNotifier: SessionInvalidationNotifier
) : Authenticator {


    override fun authenticate(route: Route?, response: Response): Request? {
        val request = response.request
        Log.d(TAG, "🔐 authenticate() INVOCADO")
        Log.d(TAG, "  → Método: ${request.method}, URL: ${request.url}")
        Log.d(TAG, "  → Status: ${response.code}")

        if (!authRetryPolicy.shouldAttemptRefresh(request, response)) {
            Log.d(TAG, "  ❌ refresh skipped due to loop protection")
            return null
        }
        Log.d(TAG, "  ✅ 401 eligible for refresh")

        Log.d(TAG, "  🔄 Intentando refresh token...")
        val refreshResult = runBlocking { refreshCoordinator.refresh() }
        Log.d(TAG, "  → Resultado refresh: $refreshResult event=auth_refresh_result")

        if (refreshResult != RefreshCoordinator.Result.SUCCESS) {
            if (refreshResult == RefreshCoordinator.Result.FAILED_UNAUTHORIZED) {
                Log.e(TAG, "  🔓 Refresh retornó 401 - Invalidación estricta de sesión event=session_invalidation")
                runBlocking { sessionInvalidationNotifier.notifySessionInvalidated() }
            } else {
                Log.e(TAG, "  ❌ Refresh falló ($refreshResult) event=session_preserved_recoverable")
            }
            Log.d(TAG, "  ❌ No se reintenta request")
            return null
        }

        Log.d(TAG, "  ✅ refresh succeeded, retrying original request")
        return request.newBuilder()
            .header(AUTH_RETRY_MARKER_HEADER, AUTH_RETRY_MARKER_VALUE)
            .build()
    }
}
