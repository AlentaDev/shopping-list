package com.alentadev.shopping.core.data.network

import com.alentadev.shopping.core.network.ConnectivityGate
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class OfflineFirstExecutorTest {

    private val executor = OfflineFirstExecutor()

    @Test
    fun `execute returns REMOTE when online and remote succeeds`() = runTest {
        val result = executor.execute(
            isOnlineNow = { true },
            fetchRemote = { "remote-data" },
            saveRemote = { },
            readLocal = { "cached-data" }
        )

        assertTrue(result is OfflineFirstResult.Success)
        val success = result as OfflineFirstResult.Success
        assertEquals("remote-data", success.data)
        assertEquals(DataSource.REMOTE, success.source)
    }

    @Test
    fun `execute returns CACHE when online and remote fails but local fallback succeeds`() = runTest {
        val result = executor.execute(
            isOnlineNow = { true },
            fetchRemote = { throw IllegalStateException("remote down") },
            saveRemote = { },
            readLocal = { "cached-data" }
        )

        assertTrue(result is OfflineFirstResult.Success)
        val success = result as OfflineFirstResult.Success
        assertEquals("cached-data", success.data)
        assertEquals(DataSource.CACHE, success.source)
    }

    @Test
    fun `execute returns CACHE when offline and local data is available`() = runTest {
        val result = executor.execute(
            isOnlineNow = { false },
            fetchRemote = { "remote-data" },
            saveRemote = { },
            readLocal = { "cached-data" }
        )

        assertTrue(result is OfflineFirstResult.Success)
        val success = result as OfflineFirstResult.Success
        assertEquals("cached-data", success.data)
        assertEquals(DataSource.CACHE, success.source)
    }

    @Test
    fun `execute returns error when offline and local is empty or fails`() = runTest {
        val result = executor.execute(
            isOnlineNow = { false },
            fetchRemote = { "remote-data" },
            saveRemote = { },
            readLocal = { throw NoSuchElementException("cache empty") }
        )

        assertTrue(result is OfflineFirstResult.Error)
        val error = result as OfflineFirstResult.Error
        assertEquals(DataSource.CACHE, error.source)
        assertTrue(error.throwable is NoSuchElementException)
    }

    @Test
    fun `execute with connectivity gate uses cache when gate reports offline`() = runTest {
        val connectivityGate = object : ConnectivityGate {
            override fun isOnline(): Boolean = false
        }
        var remoteCalled = false

        val result = executor.execute(
            connectivityGate = connectivityGate,
            fetchRemote = {
                remoteCalled = true
                "remote-data"
            },
            saveRemote = { },
            readLocal = { "cached-data" }
        )

        assertTrue(result is OfflineFirstResult.Success)
        val success = result as OfflineFirstResult.Success
        assertEquals("cached-data", success.data)
        assertEquals(DataSource.CACHE, success.source)
        assertTrue(!remoteCalled)
    }

    @Test
    fun `execute with connectivity gate uses remote when gate reports online`() = runTest {
        val connectivityGate = object : ConnectivityGate {
            override fun isOnline(): Boolean = true
        }

        val result = executor.execute(
            connectivityGate = connectivityGate,
            fetchRemote = { "remote-data" },
            saveRemote = { },
            readLocal = { "cached-data" }
        )

        assertTrue(result is OfflineFirstResult.Success)
        val success = result as OfflineFirstResult.Success
        assertEquals("remote-data", success.data)
        assertEquals(DataSource.REMOTE, success.source)
    }

}
