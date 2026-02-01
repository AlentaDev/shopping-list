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
 * - No reintenta en 4xx/5xx del servidor
 * - Delay: 1s, 2s, 4s (exponencial)
 */
class RetryInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        var lastException: IOException? = null
        var delay = INITIAL_DELAY_MS

        repeat(MAX_RETRIES) { attempt ->
            try {
                return chain.proceed(chain.request())
            } catch (e: IOException) {
                lastException = e
                Log.w(TAG, "Request falló (intento ${attempt + 1}/$MAX_RETRIES): ${e.message}")

                if (attempt < MAX_RETRIES - 1) {
                    Thread.sleep(delay)
                    delay *= 2 // Backoff exponencial
                }
            }
        }

        throw lastException ?: IOException("Máximos intentos agotados")
    }
}

