package com.alentadev.shopping.core.network

import com.alentadev.shopping.feature.auth.data.dto.OkResponse
import com.alentadev.shopping.feature.auth.data.remote.AuthApi
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import java.io.IOException
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response

class RefreshCoordinatorTest {

    private val authApi = mockk<AuthApi>()
    private val connectivityGate = mockk<ConnectivityGate>()

    @Test
    fun `multiple concurrent callers produce exactly one refresh HTTP call`() = runTest {
        every { connectivityGate.isOnline() } returns true
        val coordinator = RefreshCoordinator(connectivityGate) { authApi }
        val callCount = AtomicInteger(0)
        val gate = CompletableDeferred<Unit>()

        coEvery { authApi.refreshToken() } coAnswers {
            callCount.incrementAndGet()
            gate.await()
            OkResponse(ok = true)
        }

        val waiters = List(8) {
            async { coordinator.refresh() }
        }

        repeat(10) {
            if (callCount.get() == 1) return@repeat
            delay(10)
        }

        assertEquals(1, callCount.get())
        gate.complete(Unit)

        val results = waiters.awaitAll()
        results.forEach { result ->
            assertEquals(RefreshCoordinator.Result.SUCCESS, result)
        }

        coVerify(exactly = 1) { authApi.refreshToken() }
    }

    @Test
    fun `unauthorized refresh result is propagated to all waiters`() = runTest {
        every { connectivityGate.isOnline() } returns true
        val coordinator = RefreshCoordinator(connectivityGate) { authApi }
        val gate = CompletableDeferred<Unit>()

        coEvery { authApi.refreshToken() } coAnswers {
            gate.await()
            throw HttpException(
                Response.error<Any>(401, "unauthorized".toResponseBody(null))
            )
        }

        val waiters = List(5) {
            async { coordinator.refresh() }
        }

        // Dar tiempo a que todas las coroutines se lancen y entren al mutex
        delay(10)

        // Liberar el gate para que el refresh complete
        gate.complete(Unit)

        val results = waiters.awaitAll()

        results.forEach { result ->
            assertEquals(RefreshCoordinator.Result.FAILED_UNAUTHORIZED, result)
        }
        coVerify(exactly = 1) { authApi.refreshToken() }
    }

    @Test
    fun `lock resets after failure so a future attempt can run`() = runTest {
        every { connectivityGate.isOnline() } returns true
        val coordinator = RefreshCoordinator(connectivityGate) { authApi }

        coEvery { authApi.refreshToken() } throws IOException("network down") andThen OkResponse(ok = true)

        val firstResult = coordinator.refresh()
        val secondResult = coordinator.refresh()

        assertEquals(RefreshCoordinator.Result.FAILED_NETWORK, firstResult)
        assertEquals(RefreshCoordinator.Result.SUCCESS, secondResult)
        coVerify(exactly = 2) { authApi.refreshToken() }
    }

    @Test
    fun `offline refresh returns failed network and does not call endpoint`() = runTest {
        every { connectivityGate.isOnline() } returns false
        val coordinator = RefreshCoordinator(connectivityGate) { authApi }

        val result = coordinator.refresh()

        assertEquals(RefreshCoordinator.Result.FAILED_NETWORK, result)
        coVerify(exactly = 0) { authApi.refreshToken() }
    }

    @Test
    fun `offline result is consistent across concurrent waiters`() = runTest {
        every { connectivityGate.isOnline() } returns false
        val coordinator = RefreshCoordinator(connectivityGate) { authApi }

        val results = List(4) { async { coordinator.refresh() } }.awaitAll()

        results.forEach { result ->
            assertEquals(RefreshCoordinator.Result.FAILED_NETWORK, result)
        }
        coVerify(exactly = 0) { authApi.refreshToken() }
    }
}
