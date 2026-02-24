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
 * Ante 401 devolvemos null para que el flujo de auth se gestione aguas arriba.
 */
class TokenAuthenticator(
    private val cookieJar: PersistentCookieJar,
    private val authApiProvider: () -> AuthApi
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        if (response.code != 401) {
            return null
        }

        Log.d(TAG, "401 recibido. No se ejecuta refresh manual desde Android.")

        // No limpiar cookies aquí para no perder refresh token válido.
        // No llamar manualmente a /api/auth/refresh desde el cliente Android.
        return null
    }
}
