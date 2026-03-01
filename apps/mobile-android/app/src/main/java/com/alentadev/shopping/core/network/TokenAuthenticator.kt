package com.alentadev.shopping.core.network

import android.util.Log
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

private const val TAG = "TokenAuthenticator"

class TokenAuthenticator(
    private val cookieJar: PersistentCookieJar,
    private val authRetryPolicy: AuthRetryPolicy,
    private val refreshCoordinator: RefreshCoordinator,
    private val sessionInvalidationNotifier: SessionInvalidationNotifier
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        val request = response.request
        if (!authRetryPolicy.shouldAttemptRefresh(request, response)) {
            return null
        }

        val refreshResult = runBlocking { refreshCoordinator.refresh() }
        if (refreshResult != RefreshCoordinator.Result.SUCCESS) {
            if (refreshResult == RefreshCoordinator.Result.FAILED_UNAUTHORIZED) {
                runBlocking {
                    sessionInvalidationNotifier.notifySessionInvalidated()
                }
            }
            Log.d(TAG, "Refresh falló o no autorizado. No se reintenta request.")
            return null
        }

        Log.d(TAG, "Refresh exitoso. Reintentando request original.")
        return request.newBuilder().build()
    }
}
