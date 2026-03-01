package com.alentadev.shopping.core.network

import com.alentadev.shopping.feature.auth.data.remote.AuthApi
import java.io.IOException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import retrofit2.HttpException

class RefreshCoordinator(
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
        var isLeader = false
        val waiter = mutex.withLock {
            inFlight?.let { return@withLock it }

            isLeader = true
            CompletableDeferred<Result>().also {
                inFlight = it
            }
        }

        if (isLeader) {
            val result = performRefresh()
            waiter.complete(result)

            mutex.withLock {
                if (inFlight === waiter) {
                    inFlight = null
                }
            }
        }

        return waiter.await()
    }

    private suspend fun performRefresh(): Result {
        return try {
            authApiProvider().refreshToken()
            Result.SUCCESS
        } catch (exception: HttpException) {
            if (exception.code() == 401) {
                Result.FAILED_UNAUTHORIZED
            } else {
                Result.FAILED_NETWORK
            }
        } catch (_: IOException) {
            Result.FAILED_NETWORK
        } catch (_: Exception) {
            Result.FAILED_NETWORK
        }
    }
}
