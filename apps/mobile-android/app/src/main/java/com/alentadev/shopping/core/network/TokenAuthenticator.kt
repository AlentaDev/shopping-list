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
 * Authenticator que refresca automáticamente el token cuando recibe 401
 * Usa AuthApi.refreshToken() respetando la arquitectura
 *
 * NOTA: Recibe un Lazy<AuthApi> para evitar dependencia circular:
 * TokenAuthenticator -> AuthApi -> Retrofit -> OkHttpClient -> TokenAuthenticator
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

        // Evitar refresh del refresh
        if (response.request.url.encodedPath.endsWith("/api/auth/refresh")) {
            Log.w(TAG, "Refresh falló, limpiando cookies")
            cookieJar.clear()
            return null
        }

        return try {
            Log.d(TAG, "Token expirado (401), refrescando...")

            // Obtener AuthApi del provider (lazy)
            val authApi = authApiProvider()

            // Llamar al endpoint de refresh usando AuthApi (respetando arquitectura)
            runBlocking {
                val refreshResponse = authApi.refreshToken()
                Log.d(TAG, "Refresh exitoso: ${refreshResponse.ok}")
            }

            // El backend devuelve nuevo access_token en Set-Cookie
            // PersistentCookieJar lo guarda automáticamente
            Log.d(TAG, "Token refrescado, reintentando request original")

            // Reintentar el request original con el nuevo token
            response.request.newBuilder().build()

        } catch (e: Exception) {
            Log.e(TAG, "Error al refrescar token: ${e.message}", e)
            // Si el refresh falla, limpiar cookies (usuario debe re-loguearse)
            cookieJar.clear()
            null
        }
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
}
