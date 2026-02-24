package com.alentadev.shopping.core.network

import okhttp3.Cookie
import okhttp3.HttpUrl.Companion.toHttpUrl
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CookieStorageTest {

    @Test
    fun `loadFor returns cookie saved for same host`() {
        val storage = CookieStorage()
        val cookie = Cookie.Builder()
            .name("access_token")
            .value("abc")
            .domain("10.0.2.2")
            .build()

        storage.save(listOf(cookie))

        val result = storage.loadFor("http://10.0.2.2:3000/api/lists".toHttpUrl())

        assertEquals(1, result.size)
        assertEquals("access_token", result.first().name)
    }

    @Test
    fun `loadFor ignores cookie for different host`() {
        val storage = CookieStorage()
        val cookie = Cookie.Builder()
            .name("access_token")
            .value("abc")
            .domain("example.com")
            .build()

        storage.save(listOf(cookie))

        val result = storage.loadFor("http://10.0.2.2:3000/api/lists".toHttpUrl())

        assertTrue(result.isEmpty())
    }

    @Test
    fun `clear removes all cookies`() {
        val storage = CookieStorage()
        val cookie = Cookie.Builder()
            .name("access_token")
            .value("abc")
            .domain("10.0.2.2")
            .build()

        storage.save(listOf(cookie))
        storage.clear()

        val result = storage.loadFor("http://10.0.2.2:3000/api/lists".toHttpUrl())
        assertTrue(result.isEmpty())
    }
}
