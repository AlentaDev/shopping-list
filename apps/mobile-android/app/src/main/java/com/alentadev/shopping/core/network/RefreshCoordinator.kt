package com.alentadev.shopping.core.network

import com.alentadev.shopping.feature.auth.data.remote.AuthApi
import java.io.IOException
import java.util.concurrent.atomic.AtomicBoolean
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import retrofit2.HttpException

class RefreshCoordinator(
    private val authApiProvider: () -> AuthApi,
    private val cookieJar: PersistentCookieJar,
    private val sessionInvalidationNotifier: SessionInvalidationNotifier
) {

    enum class Result {
        SUCCESS,
        FAILED_UNAUTHORIZED,
        FAILED_NETWORK
    }

    private val mutex = Mutex()
    private var inFlight: CompletableDeferred<Result>? = null
    private val hasInvalidatedSession = AtomicBoolean(false)

    suspend fun refresh(): Result {
        val (waiter, isLeader) = mutex.withLock {
            val existing = inFlight
            if (existing != null && !existing.isCompleted) {
                Pair(existing, false)
            } else {
                val new = CompletableDeferred<Result>()
                inFlight = new
                Pair(new, true)
            }
        }

        return if (isLeader) {
            val result = performRefresh()
            waiter.complete(result)

            mutex.withLock {
                if (inFlight === waiter) inFlight = null
            }

            result
        } else {
            waiter.await()
        }
    }

    private suspend fun performRefresh(): Result {
        return try {
            authApiProvider().refreshToken()
            hasInvalidatedSession.set(false)
            Result.SUCCESS
        } catch (exception: HttpException) {
            if (exception.code() == 401) {
                notifyUnauthorizedRefresh()
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

    private fun notifyUnauthorizedRefresh() {
        if (!hasInvalidatedSession.compareAndSet(false, true)) {
            return
        }

        cookieJar.clear()
        sessionInvalidationNotifier.notifySessionInvalidated()
    }
}
