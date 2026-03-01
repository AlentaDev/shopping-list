package com.alentadev.shopping.core.network

import android.util.Log
import com.alentadev.shopping.feature.auth.data.remote.AuthApi
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
    private val authApiProvider: () -> AuthApi
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        val request = response.request
        if (!shouldAttemptRefresh(request, response)) {
            return null
        }

        Log.d(TAG, "401 recibido. Reintentando una vez con cookies actuales.")

        // No limpiar cookies ni forzar refresh manual desde Android.
        return request.newBuilder().build()
    }

}
