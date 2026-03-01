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
    private val cookieJar: PersistentCookieJar,
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
            Log.d(TAG, "  ❌ Policy dice NO reintentar")
            return null
        }
        Log.d(TAG, "  ✅ Policy dice SÍ reintentar")

        Log.d(TAG, "  🔄 Intentando refresh token...")
        val refreshResult = runBlocking { refreshCoordinator.refresh() }
        Log.d(TAG, "  → Resultado refresh: $refreshResult")

        if (refreshResult != RefreshCoordinator.Result.SUCCESS) {
            if (refreshResult == RefreshCoordinator.Result.FAILED_UNAUTHORIZED) {
                Log.e(TAG, "  🔓 Refresh retornó 401 - Limpiando sesión")
                runBlocking { sessionInvalidationNotifier.notifySessionInvalidated() }
                cookieJar.clear()
            } else {
                Log.e(TAG, "  ❌ Refresh falló ($refreshResult)")
            }
            Log.d(TAG, "  ❌ No se reintenta request")
            return null
        }

        Log.d(TAG, "  ✅ Refresh exitoso - Reintentando request con nuevas cookies")
        return request.newBuilder().build()
    }
}

