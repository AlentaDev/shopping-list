package com.alentadev.shopping.network

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.runBlocking
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl

private const val COOKIE_PREFS_NAME = "shopping_cookies"
private val Context.cookieDataStore by preferencesDataStore(name = COOKIE_PREFS_NAME)
private val COOKIES_KEY = stringSetPreferencesKey("cookies")

/**
 * CookieJar que persiste cookies usando DataStore.
 * Las cookies HttpOnly se almacenan automáticamente cuando OkHttp las recibe.
 */
class PersistentCookieJar(private val context: Context) : CookieJar {

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val cookieStrings = cookies.map { it.toString() }.toSet()

        // Guardar de forma síncrona (runBlocking) para no perder cookies
        runBlocking {
            context.cookieDataStore.edit { preferences ->
                val existingCookies = preferences[COOKIES_KEY] ?: emptySet()
                // Combinar cookies existentes con nuevas, pero reemplazar si ya existen
                val updatedCookies = (existingCookies.filterNot { existing ->
                    cookieStrings.any { existing.startsWith(it.split("=")[0]) }
                } + cookieStrings).toSet()
                preferences[COOKIES_KEY] = updatedCookies
            }
        }
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val cookies = mutableListOf<Cookie>()

        runBlocking {
            context.cookieDataStore.data.collect { preferences ->
                val cookieStrings = preferences[COOKIES_KEY] ?: emptySet()
                cookieStrings.forEach { cookieString ->
                    val cookie = parseCookieString(cookieString, url)
                    if (cookie != null && !cookie.expired()) {
                        cookies.add(cookie)
                    }
                }
            }
        }

        return cookies
    }

    private fun parseCookieString(cookieString: String, url: HttpUrl): Cookie? {
        return try {
            val parts = cookieString.split(";")
            val nameValue = parts[0].trim().split("=", limit = 2)
            if (nameValue.size != 2) return null

            val name = nameValue[0].trim()
            val value = nameValue[1].trim()

            val builder = Cookie.Builder()
                .name(name)
                .value(value)
                .domain(url.host)

            parts.drop(1).forEach { attribute ->
                val attr = attribute.trim().lowercase()
                when {
                    attr == "httponly" -> builder.httpOnly()
                    attr == "secure" -> builder.secure()
                    attr.startsWith("path=") -> builder.path(attr.substring(5))
                    attr.startsWith("expires=") -> {
                        // Parsear fecha de expiración si es necesario
                    }
                }
            }

            builder.build()
        } catch (e: Exception) {
            null
        }
    }

    private fun Cookie.expired(): Boolean {
        return System.currentTimeMillis() > expiresAt
    }
}

