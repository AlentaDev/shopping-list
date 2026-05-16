package com.alentadev.shopping.core.network

import okhttp3.Cookie
import okhttp3.HttpUrl.Companion.toHttpUrl
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CookieStorageTest {

    @Test
    fun `parsePersistedCookieEntries supports multiple serialized cookies separated by semicolon`() {
        val cookie1 = "session|tokenA|10.0.2.2|/|true|true|true|1715940000000"
        val cookie2 = "refresh|tokenB|10.0.2.2|/|true|true|true|1715940000000"

        val entries = PersistentCookieJar.parsePersistedCookieEntries("$cookie1;$cookie2")

        assertEquals(2, entries.size)
        assertEquals(cookie1, entries[0])
        assertEquals(cookie2, entries[1])
    }

    @Test
    fun `parsePersistedCookieEntries does not require equal sign in each cookie entry`() {
        val cookie = "session|token-without-equals|10.0.2.2|/|true|true|true|1715940000000"

        val entries = PersistentCookieJar.parsePersistedCookieEntries(cookie)

        assertEquals(1, entries.size)
        assertEquals(cookie, entries[0])
    }

    @Test
    fun `parsePersistedCookiesMap preserves serialized entries for load round-trip`() {
        val cookie1 = "session|tokenA|10.0.2.2|/|true|true|true|1715940000000"
        val cookie2 = "refresh|tokenB|10.0.2.2|/|true|true|true|1715940000001"

        val map = PersistentCookieJar.parsePersistedCookiesMap("$cookie1;$cookie2")

        assertEquals(2, map.size)
        assertEquals(cookie1, map["0"])
        assertEquals(cookie2, map["1"])
    }

    @Test
    fun `parseSerializedCookieParts splits cookie payload into expected fields`() {
        val serialized = "session|token|api-shopping-list.onrender.com|/|true|true|true|1715940000000"

        val parts = PersistentCookieJar.parseSerializedCookieParts(serialized)

        assertEquals(8, parts.size)
        assertEquals("session", parts[0])
        assertEquals("token", parts[1])
    }

    @Test
    fun `allows cookie only for active API host domain`() {
        assertTrue(PersistentCookieJar.isCookieDomainAllowed("10.0.2.2", "10.0.2.2"))
        assertFalse(PersistentCookieJar.isCookieDomainAllowed("10.0.2.2", "api-shopping-list.onrender.com"))
    }

    @Test
    fun `allows parent domain cookie for active subdomain`() {
        assertTrue(
            PersistentCookieJar.isCookieDomainAllowed(
                "onrender.com",
                "api-shopping-list.onrender.com"
            )
        )
    }

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
