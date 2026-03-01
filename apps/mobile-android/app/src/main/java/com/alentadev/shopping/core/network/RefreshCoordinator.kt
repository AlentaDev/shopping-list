package com.alentadev.shopping.core.network

import android.util.Log
import com.alentadev.shopping.feature.auth.data.remote.AuthApi
import java.io.IOException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import retrofit2.HttpException

private const val TAG = "RefreshCoordinator"

class RefreshCoordinator(
    private val connectivityGate: ConnectivityGate,
    private val authApiProvider: () -> AuthApi
) {

    enum class Result {
        SUCCESS,
        FAILED_UNAUTHORIZED,
        FAILED_NETWORK
    }

    private val mutex = Mutex()
    private var inFlight: CompletableDeferred<Result>? = null

    suspend fun refresh(): Result {
        Log.d(TAG, "🔄 refresh() INICIADO")

        // Determinar si somos líder u obtener el waiter existente
        val (waiter, isLeader) = mutex.withLock {
            val existing = inFlight
            if (existing != null && !existing.isCompleted) {
                Log.d(TAG, "  → Hay refresh en progreso, esperando resultado...")
                // Hay un refresh en progreso, somos seguidores
                Pair(existing, false)
            } else {
                Log.d(TAG, "  → Somos el líder, ejecutando refresh")
                // No hay refresh o ya completó, somos el líder
                val new = CompletableDeferred<Result>()
                inFlight = new
                Pair(new, true)
            }
        }

        return if (isLeader) {
            // Ejecutar el refresh, completar el waiter y limpiar
            val result = performRefresh()
            Log.d(TAG, "  ✅ Refresh completado: $result")
            waiter.complete(result)

            mutex.withLock {
                if (inFlight === waiter) inFlight = null
            }

            result
        } else {
            // Solo esperar el resultado del líder
            val result = waiter.await()
            Log.d(TAG, "  ✅ Recibido resultado del líder: $result")
            result
        }
    }

    private suspend fun performRefresh(): Result {
        Log.d(TAG, "  🌐 performRefresh() INICIADO")

        if (!connectivityGate.isOnline()) {
            Log.w(TAG, "    ❌ Sin conexión")
            return Result.FAILED_NETWORK
        }
        Log.d(TAG, "    ✅ Hay conexión")

        return try {
            Log.d(TAG, "    🔄 Llamando a authApi.refreshToken()...")
            authApiProvider().refreshToken()
            Log.d(TAG, "    ✅ refreshToken() exitoso")
            Result.SUCCESS
        } catch (exception: HttpException) {
            Log.e(TAG, "    ❌ HttpException: ${exception.code()} - ${exception.message()}")
            if (exception.code() == 401) {
                Log.e(TAG, "    🔓 Recibido 401 en refresh")
                Result.FAILED_UNAUTHORIZED
            } else {
                Log.e(TAG, "    Error HTTP ${exception.code()}")
                Result.FAILED_NETWORK
            }
        } catch (exception: IOException) {
            Log.e(TAG, "    ❌ IOException: ${exception.message}")
            Result.FAILED_NETWORK
        } catch (exception: Exception) {
            Log.e(TAG, "    ❌ Exception: ${exception::class.simpleName} - ${exception.message}")
            Result.FAILED_NETWORK
        }
    }
}
