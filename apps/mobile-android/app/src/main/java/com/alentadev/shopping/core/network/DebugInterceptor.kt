package com.alentadev.shopping.core.network

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

private const val TAG = "OkHttpDebug"

enum class NetworkLogLevel {
    DEBUG,
    ERROR
}

fun interface NetworkLogSink {
    fun log(level: NetworkLogLevel, tag: String, message: String)
}

private object AndroidNetworkLogSink : NetworkLogSink {
    override fun log(level: NetworkLogLevel, tag: String, message: String) {
        when (level) {
            NetworkLogLevel.DEBUG -> Log.d(tag, message)
            NetworkLogLevel.ERROR -> Log.e(tag, message)
        }
    }
}

class DebugInterceptor(
    internal val mode: DebugLogMode = DebugLogMode.VERBOSE,
    private val clock: () -> Long = System::currentTimeMillis,
    private val logger: NetworkLogSink = AndroidNetworkLogSink
) : Interceptor {
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val startTime = clock()

        when (mode) {
            DebugLogMode.VERBOSE -> logVerboseRequest(request)
            DebugLogMode.SAFE_METADATA -> logSafeRequest(request)
        }

        return try {
            val response = chain.proceed(request)
            val duration = clock() - startTime

            when (mode) {
                DebugLogMode.VERBOSE -> logVerboseResponse(response, duration)
                DebugLogMode.SAFE_METADATA -> logSafeResponse(response, duration)
            }

            response
        } catch (e: IOException) {
            val duration = clock() - startTime

            when (mode) {
                DebugLogMode.VERBOSE -> logVerboseError(e, duration)
                DebugLogMode.SAFE_METADATA -> logSafeError(e, duration)
            }

            throw e
        }
    }

    private fun logVerboseRequest(request: okhttp3.Request) {
        debug("╔════════════════════════════════════════════════════════════════")
        debug("║ REQUEST INICIADO")
        debug("║ URL: ${request.url}")
        debug("║ Método: ${request.method}")
        debug("║ Headers:")
        request.headers.forEach { (name, value) ->
            debug("║   $name: $value")
        }
        if (request.body != null) {
            debug("║ Body: ${request.body}")
        }
        debug("╚════════════════════════════════════════════════════════════════")
    }

    private fun logSafeRequest(request: okhttp3.Request) {
        debug("Request started")
        debug("Method: ${request.method}")
        debug("Host: ${request.url.host}")
    }

    private fun logVerboseResponse(response: Response, duration: Long) {
        debug("╔════════════════════════════════════════════════════════════════")
        debug("║ RESPONSE RECIBIDO")
        debug("║ Status: ${response.code} ${response.message}")
        debug("║ Duración: ${duration}ms")
        debug("║ priorResponse: ${response.priorResponse?.code} (reintentos)")
        debug("║ Headers:")
        response.headers.forEach { (name, value) ->
            debug("║   $name: $value")
        }
        debug("║ Body length: ${response.body?.contentLength() ?: "unknown"} bytes")
        debug("╚════════════════════════════════════════════════════════════════")
    }

    private fun logSafeResponse(response: Response, duration: Long) {
        debug("Response received")
        debug("Status: ${response.code}")
        debug("Duration: ${duration}ms")
        debug("Retried: ${response.priorResponse != null}")
    }

    private fun logVerboseError(error: IOException, duration: Long) {
        failure("╔════════════════════════════════════════════════════════════════")
        failure("║ ERROR EN REQUEST")
        failure("║ Duración antes del error: ${duration}ms")
        failure("║ Tipo de error: ${error::class.simpleName}")
        failure("║ Mensaje: ${error.message}")
        failure("║ Stack trace:")
        error.stackTraceToString().lines().forEach { line ->
            if (line.isNotBlank()) failure("║ $line")
        }
        failure("╚════════════════════════════════════════════════════════════════")
    }

    private fun logSafeError(error: IOException, duration: Long) {
        failure("Request failed")
        failure("Duration: ${duration}ms")
        failure("Error type: ${error::class.simpleName}")
    }

    private fun debug(message: String) {
        logger.log(NetworkLogLevel.DEBUG, TAG, message)
    }

    private fun failure(message: String) {
        logger.log(NetworkLogLevel.ERROR, TAG, message)
    }
}
