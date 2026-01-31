package com.alentadev.shopping.network

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

private const val TAG = "OkHttpDebug"

class DebugInterceptor : Interceptor {
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val startTime = System.currentTimeMillis()

        Log.d(TAG, "╔════════════════════════════════════════════════════════════════")
        Log.d(TAG, "║ REQUEST INICIADO")
        Log.d(TAG, "║ URL: ${request.url}")
        Log.d(TAG, "║ Método: ${request.method}")
        Log.d(TAG, "║ Headers:")
        request.headers.forEach { (name, value) ->
            Log.d(TAG, "║   $name: $value")
        }
        if (request.body != null) {
            Log.d(TAG, "║ Body: ${request.body}")
        }
        Log.d(TAG, "╚════════════════════════════════════════════════════════════════")

        return try {
            val response = chain.proceed(request)
            val duration = System.currentTimeMillis() - startTime

            Log.d(TAG, "╔════════════════════════════════════════════════════════════════")
            Log.d(TAG, "║ RESPONSE RECIBIDO")
            Log.d(TAG, "║ Status: ${response.code} ${response.message}")
            Log.d(TAG, "║ Duración: ${duration}ms")
            Log.d(TAG, "║ Headers:")
            response.headers.forEach { (name, value) ->
                Log.d(TAG, "║   $name: $value")
            }
            Log.d(TAG, "║ Body length: ${response.body?.contentLength() ?: "unknown"} bytes")
            Log.d(TAG, "╚════════════════════════════════════════════════════════════════")

            response
        } catch (e: IOException) {
            val duration = System.currentTimeMillis() - startTime
            Log.e(TAG, "╔════════════════════════════════════════════════════════════════")
            Log.e(TAG, "║ ERROR EN REQUEST")
            Log.e(TAG, "║ Duración antes del error: ${duration}ms")
            Log.e(TAG, "║ Tipo de error: ${e::class.simpleName}")
            Log.e(TAG, "║ Mensaje: ${e.message}")
            Log.e(TAG, "║ Stack trace:")
            e.stackTraceToString().lines().forEach { line ->
                if (line.isNotBlank()) Log.e(TAG, "║ $line")
            }
            Log.e(TAG, "╚════════════════════════════════════════════════════════════════")
            throw e
        }
    }
}

