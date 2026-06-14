package com.alentadev.shopping.core.network

import com.alentadev.shopping.core.network.di.NetworkModule
import okhttp3.logging.HttpLoggingInterceptor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class NetworkModuleLoggingPolicyTest {

    @Test
    fun `debug builds keep verbose network logging`() {
        val policy = NetworkModule.resolveNetworkLoggingPolicy(
            apiBaseUrl = "http://10.0.2.2:3000",
            isDebugBuild = true,
            isReleaseCapable = false,
            isProductionApiTarget = false
        )

        assertEquals(HttpLoggingInterceptor.Level.BODY, policy.httpLoggingLevel)
        assertEquals(DebugLogMode.VERBOSE, policy.debugLogMode)
        assertEquals(
            HttpLoggingInterceptor.Level.BODY,
            NetworkModule.provideHttpLoggingInterceptor(policy).level
        )
    }

    @Test
    fun `release capable builds restrict logging to safe metadata`() {
        val policy = NetworkModule.resolveNetworkLoggingPolicy(
            apiBaseUrl = "https://api-shopping-list.onrender.com",
            isDebugBuild = false,
            isReleaseCapable = true,
            isProductionApiTarget = true
        )

        assertEquals(HttpLoggingInterceptor.Level.NONE, policy.httpLoggingLevel)
        assertEquals(DebugLogMode.SAFE_METADATA, policy.debugLogMode)
        assertEquals(DebugLogMode.SAFE_METADATA, NetworkModule.provideDebugInterceptor(policy).mode)
    }

    @Test
    fun `production api targets stay on safe metadata even in debug builds`() {
        val policy = NetworkModule.resolveNetworkLoggingPolicy(
            apiBaseUrl = "https://api-shopping-list.onrender.com",
            isDebugBuild = true,
            isReleaseCapable = false,
            isProductionApiTarget = true
        )

        assertEquals(HttpLoggingInterceptor.Level.NONE, policy.httpLoggingLevel)
        assertEquals(DebugLogMode.SAFE_METADATA, policy.debugLogMode)
    }

    @Test
    fun `release capable safety wins even when debug flag is also true`() {
        val policy = NetworkModule.resolveNetworkLoggingPolicy(
            apiBaseUrl = "https://staging-shopping-list.internal",
            isDebugBuild = true,
            isReleaseCapable = true,
            isProductionApiTarget = false
        )

        assertEquals(HttpLoggingInterceptor.Level.NONE, policy.httpLoggingLevel)
        assertEquals(DebugLogMode.SAFE_METADATA, policy.debugLogMode)
    }

    @Test
    fun `release capable local api url is blocked`() {
        val error = assertThrows(IllegalStateException::class.java) {
            NetworkModule.resolveNetworkLoggingPolicy(
                apiBaseUrl = "http://10.0.2.2:3000",
                isDebugBuild = false,
                isReleaseCapable = true,
                isProductionApiTarget = false
            )
        }

        assertTrue(error.message.orEmpty().contains("Release-capable builds must not use local API base URLs"))
    }

    @Test
    fun `release capable private api url is blocked`() {
        val error = assertThrows(IllegalStateException::class.java) {
            NetworkModule.resolveNetworkLoggingPolicy(
                apiBaseUrl = "http://192.168.1.20:3000",
                isDebugBuild = false,
                isReleaseCapable = true,
                isProductionApiTarget = false
            )
        }

        assertTrue(error.message.orEmpty().contains("Release-capable builds must not use local API base URLs"))
    }
}
