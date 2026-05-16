package com.alentadev.shopping.core.network

import android.content.Context
import android.util.Log
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.alentadev.shopping.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

private val Context.cookieDataStore by preferencesDataStore(name = "cookies")
private const val TAG = "PersistentCookieJar"

class PersistentCookieJar(private val context: Context) : CookieJar, AuthCredentialProvider {
    private val COOKIES_KEY = stringPreferencesKey("saved_cookies")
    private val scope = CoroutineScope(Dispatchers.IO)
    private val cookieStorage = CookieStorage()

    init {
        runCatching {
                val persistedCookies = runBlocking {
                    val activeHost = activeApiHost()
                    loadCookies().values.mapNotNull { deserializeCookie(it, activeHost) }
                }
            cookieStorage.save(persistedCookies)
        }.onFailure {
            Log.e(TAG, "Error cargando cookies persistidas", it)
        }
    }

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        // Guardado inmediato en memoria para que un retry inmediato use cookies nuevas
            val activeHost = activeApiHost()
            val hostScopedCookies = cookies.filter { cookie ->
                cookie.domain.equals(activeHost, ignoreCase = true) || cookie.matchesHost(activeHost)
            }
            cookieStorage.save(hostScopedCookies)

        scope.launch {
            try {
                val serialized = cookieStorage.snapshot().joinToString(";") { serializeCookie(it) }
                context.cookieDataStore.edit { prefs ->
                    prefs[COOKIES_KEY] = serialized
                }
                Log.d(TAG, "Cookies guardadas: ${cookies.size} nuevas cookies")
            } catch (e: Exception) {
                Log.e(TAG, "Error al guardar cookies", e)
            }
        }
    }


    override fun hasCredentials(url: HttpUrl): Boolean {
        return loadForRequest(url).isNotEmpty()
    }

    override fun buildCookieHeader(url: HttpUrl): String? {
        val cookies = loadForRequest(url)
        if (cookies.isEmpty()) return null
        return cookies.joinToString("; ") { "${it.name}=${it.value}" }
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        return try {
            cookieStorage.loadFor(url)
        } catch (e: Exception) {
            Log.e(TAG, "Error al cargar cookies", e)
            emptyList()
        }
    }

    fun clear() {
        cookieStorage.clear()
        scope.launch {
            try {
                context.cookieDataStore.edit { it.clear() }
                Log.d(TAG, "Cookies limpiadas")
            } catch (e: Exception) {
                Log.e(TAG, "Error al limpiar cookies", e)
            }
        }
    }

    private suspend fun loadCookies(): Map<String, String> {
        return try {
            val cookiesString = context.cookieDataStore.data.map { prefs ->
                prefs[COOKIES_KEY] ?: ""
            }.first()

            if (cookiesString.isEmpty()) return emptyMap()

            cookiesString.split(";")
                .filter { it.isNotBlank() }
                .mapNotNull {
                    val parts = it.split("=", limit = 2)
                    if (parts.size == 2) parts[0] to it else null
                }
                .toMap()
        } catch (e: Exception) {
            Log.e(TAG, "Error al cargar cookies de DataStore", e)
            emptyMap()
        }
    }

    private fun serializeCookie(cookie: Cookie): String {
        return listOf(
            cookie.name,
            cookie.value,
            cookie.domain,
            cookie.path,
            cookie.secure.toString(),
            cookie.httpOnly.toString(),
            cookie.persistent.toString(),
            cookie.expiresAt.toString()
        ).joinToString("|")
    }

    private fun deserializeCookie(serialized: String, activeHost: String): Cookie? {
        return try {
            val parts = serialized.split("|")
            if (parts.size != 8) return null

            val domain = parts[2]
            if (!isCookieDomainAllowed(domain, activeHost)) {
                return null
            }

            Cookie.Builder()
                .name(parts[0])
                .value(parts[1])
                .domain(domain)
                .path(parts[3])
                .apply {
                    if (parts[4].toBoolean()) secure()
                    if (parts[5].toBoolean()) httpOnly()
                    if (parts[6].toBoolean()) {
                        expiresAt(parts[7].toLongOrNull() ?: Long.MAX_VALUE)
                    }
                }
                .build()
        } catch (e: Exception) {
            Log.e(TAG, "Error al deserializar cookie: $serialized", e)
            null
        }
    }

    private fun activeApiHost(): String {
        return BuildConfig.API_BASE_URL.toHttpUrlOrNull()?.host ?: ""
    }

    private fun Cookie.matchesHost(host: String): Boolean {
        if (host.isBlank()) return false
        val scheme = if (secure) "https" else "http"
        val url = "$scheme://$host".toHttpUrlOrNull() ?: return false
        return matches(url)
    }

    companion object {
        internal fun isCookieDomainAllowed(cookieDomain: String, activeHost: String): Boolean {
            if (cookieDomain.isBlank() || activeHost.isBlank()) return false
            if (cookieDomain.equals(activeHost, ignoreCase = true)) return true
            return activeHost.endsWith(".$cookieDomain", ignoreCase = true)
        }
    }
}
