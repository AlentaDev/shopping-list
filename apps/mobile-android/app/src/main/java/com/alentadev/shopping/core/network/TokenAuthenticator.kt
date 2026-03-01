package com.alentadev.shopping.core.network

import android.util.Log
import com.alentadev.shopping.feature.auth.data.remote.AuthApi
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
    private val refreshCoordinator: RefreshCoordinator
) : Authenticator {

    constructor(
        cookieJar: PersistentCookieJar,
        connectivityGate: ConnectivityGate,
        authApiProvider: () -> AuthApi
    ) : this(
        cookieJar = cookieJar,
        refreshCoordinator = RefreshCoordinator(connectivityGate, authApiProvider)
    )

    override fun authenticate(route: Route?, response: Response): Request? {
        val request = response.request
        if (!shouldAttemptRefresh(request, response)) {
            return null
        }

        val refreshResult = runBlocking { refreshCoordinator.refresh() }
        if (refreshResult != RefreshCoordinator.Result.SUCCESS) {
            Log.d(TAG, "Refresh falló o no autorizado. No se reintenta request.")
            return null
        }

        Log.d(TAG, "Refresh exitoso. Reintentando request original.")
        return request.newBuilder().build()
    }

}
