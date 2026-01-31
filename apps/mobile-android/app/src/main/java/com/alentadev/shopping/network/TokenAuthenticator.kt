package com.alentadev.shopping.network

import android.util.Log
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

private const val TAG = "TokenAuthenticator"

class TokenAuthenticator(private val cookieJar: PersistentCookieJar) : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        try {
            // Si recibimos 401, podríamos intentar refrescar el token aquí
            // Por ahora, simplemente limpiamos las cookies
            if (response.code == 401) {
                Log.d(TAG, "Recibido 401 Unauthorized, limpiando cookies")
                cookieJar.clear()
            }
            return null
        } catch (e: Exception) {
            Log.e(TAG, "Error en authenticate", e)
            return null
        }
    }
}

