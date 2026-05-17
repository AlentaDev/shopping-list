package com.alentadev.shopping.infrastructure.observability

object SentryConfig {
    fun shouldInit(dsn: String): Boolean = dsn.isNotBlank()

    fun resolveEnvironment(isDebug: Boolean): String =
        if (isDebug) "development" else "production"
}
