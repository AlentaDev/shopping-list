package com.alentadev.shopping

import android.app.Application
import android.util.Log
import com.alentadev.shopping.infrastructure.observability.SentryConfig
import dagger.hilt.android.HiltAndroidApp
import io.sentry.android.core.SentryAndroid

@HiltAndroidApp
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()

        if (SentryConfig.shouldInit(BuildConfig.SENTRY_DSN)) {
            SentryAndroid.init(this) { options ->
                options.dsn = BuildConfig.SENTRY_DSN
                options.environment = SentryConfig.resolveEnvironment(BuildConfig.DEBUG)
                options.release =
                    "${BuildConfig.APPLICATION_ID}@${BuildConfig.VERSION_NAME}+${BuildConfig.VERSION_CODE}"
            }
        }

        Log.d("MyApp", "Application iniciada con Hilt")
    }
}
