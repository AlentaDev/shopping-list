package com.alentadev.shopping.core.network

import okhttp3.Cookie
import okhttp3.HttpUrl
import java.util.concurrent.ConcurrentHashMap

/**
 * Almacenamiento en memoria para cookies de sesión.
 * Se usa para que un retry inmediato tras 401 vea las cookies recién recibidas.
 */
class CookieStorage {
    private val cookiesByName = ConcurrentHashMap<String, Cookie>()

    fun save(cookies: List<Cookie>) {
        cookies.forEach { cookie ->
            cookiesByName[cookie.name] = cookie
        }
    }

    fun loadFor(url: HttpUrl): List<Cookie> {
        val now = System.currentTimeMillis()
        return cookiesByName.values
            .filter { cookie ->
                !cookie.expiresAt.let { it != Long.MAX_VALUE && it < now }
            }
            .filter { cookie -> cookie.matches(url) }
    }

    fun snapshot(): List<Cookie> = cookiesByName.values.toList()

    fun clear() {
        cookiesByName.clear()
    }
}
