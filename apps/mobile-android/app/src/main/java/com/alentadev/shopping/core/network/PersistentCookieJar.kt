package com.alentadev.shopping.core.network

import android.content.Context
import android.util.Log
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl

private val Context.cookieDataStore by preferencesDataStore(name = "cookies")
private const val TAG = "PersistentCookieJar"

class PersistentCookieJar(private val context: Context) : CookieJar {
    private val COOKIES_KEY = stringPreferencesKey("saved_cookies")
    private val scope = CoroutineScope(Dispatchers.IO)
    private val cookieStorage = CookieStorage()

    init {
        runCatching {
            val persistedCookies = runBlocking {
                loadCookies().values.mapNotNull { deserializeCookie(it) }
            }
            cookieStorage.save(persistedCookies)
        }.onFailure {
            Log.e(TAG, "Error cargando cookies persistidas", it)
        }
    }

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        // Guardado inmediato en memoria para que un retry inmediato use cookies nuevas
        cookieStorage.save(cookies)

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
        return "${cookie.name}=${cookie.value}"
    }

    private fun deserializeCookie(serialized: String): Cookie? {
        return try {
            val parts = serialized.split("=", limit = 2)
            if (parts.size != 2) return null
            Cookie.Builder()
                .name(parts[0])
                .value(parts[1])
                .domain("10.0.2.2")
                .build()
        } catch (e: Exception) {
            Log.e(TAG, "Error al deserializar cookie: $serialized", e)
            null
        }
    }
}
