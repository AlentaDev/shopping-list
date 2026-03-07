package com.alentadev.shopping.core.network

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

private const val TAG = "RetryInterceptor"
private const val MAX_RETRIES = 3
private const val INITIAL_DELAY_MS = 1000L

/**
 * Interceptor que reintentar requests fallidas con backoff exponencial.
 *
 * Estrategia:
 * - Reintenta solo en errores de red (timeout, conexión rechazada, etc)
 * - Si no hay conectividad, corta los reintentos inmediatamente
 * - No reintenta en 4xx/5xx del servidor
 * - Delay: 1s, 2s, 4s (exponencial)
 */
class RetryInterceptor(
    private val connectivityGate: ConnectivityGate,
    private val sleep: (Long) -> Unit = { Thread.sleep(it) }
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        if (!connectivityGate.isOnline()) {
            Log.w(TAG, "Sin conexión detectada antes del primer intento")
            throw IOException("No network available")
        }

        var lastException: IOException? = null
        var delay = INITIAL_DELAY_MS

        repeat(MAX_RETRIES) { attempt ->
            try {
                return chain.proceed(chain.request())
            } catch (e: IOException) {
                lastException = e
                Log.w(TAG, "Request falló (intento ${attempt + 1}/$MAX_RETRIES): ${e.message}")

                if (!connectivityGate.isOnline()) {
                    Log.w(TAG, "Sin conexión: se cancelan reintentos")
                    throw e
                }

                if (attempt < MAX_RETRIES - 1) {
                    sleep(delay)
                    delay *= 2 // Backoff exponencial
                }
            }
        }

        throw lastException ?: IOException("Máximos intentos agotados")
    }
}
