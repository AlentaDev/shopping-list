package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import okhttp3.ResponseBody.Companion.toResponseBody
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException
import java.net.SocketTimeoutException

class SyncCheckUseCaseTest {
    private lateinit var repository: ListDetailRepository
    private lateinit var useCase: SyncCheckUseCase

    @Before
    fun setup() {
        repository = mockk()
        useCase = SyncCheckUseCase(repository)
    }

    @Test
    fun `invoke returns success when remote sync succeeds`() = runTest {
        coEvery { repository.syncItemCheck("list-1", "item-1", true) } returns Unit

        val result = useCase("list-1", "item-1", true)

        assertTrue(result is SyncCheckResult.Success)
        coVerify(exactly = 1) { repository.syncItemCheck("list-1", "item-1", true) }
        coVerify(exactly = 0) { repository.enqueuePendingCheckOperation(any(), any(), any(), any()) }
        coVerify(exactly = 0) { repository.markCheckOperationFailedPermanent(any(), any(), any(), any()) }
    }

    @Test
    fun `invoke enqueues pending operation on io exception`() = runTest {
        coEvery { repository.syncItemCheck("list-1", "item-1", false) } throws IOException("network down")
        coEvery { repository.enqueuePendingCheckOperation(any(), any(), any(), any()) } returns Unit

        val result = useCase("list-1", "item-1", false)

        assertTrue(result is SyncCheckResult.TransientFailure)
        coVerify(exactly = 1) { repository.enqueuePendingCheckOperation("list-1", "item-1", false, any()) }
    }

    @Test
    fun `invoke enqueues pending operation on timeout exception`() = runTest {
        coEvery { repository.syncItemCheck("list-1", "item-1", false) } throws SocketTimeoutException("timeout")
        coEvery { repository.enqueuePendingCheckOperation(any(), any(), any(), any()) } returns Unit

        val result = useCase("list-1", "item-1", false)

        assertTrue(result is SyncCheckResult.TransientFailure)
        coVerify(exactly = 1) { repository.enqueuePendingCheckOperation("list-1", "item-1", false, any()) }
    }

    @Test
    fun `invoke enqueues pending operation on 5xx error`() = runTest {
        val error = HttpException(Response.error<Any>(503, "".toResponseBody()))
        coEvery { repository.syncItemCheck("list-1", "item-1", true) } throws error
        coEvery { repository.enqueuePendingCheckOperation(any(), any(), any(), any()) } returns Unit

        val result = useCase("list-1", "item-1", true)

        assertTrue(result is SyncCheckResult.TransientFailure)
        coVerify(exactly = 1) { repository.enqueuePendingCheckOperation("list-1", "item-1", true, any()) }
        coVerify(exactly = 0) { repository.markCheckOperationFailedPermanent(any(), any(), any(), any()) }
    }

    @Test
    fun `invoke marks permanent failure on 403 error`() = runTest {
        val error = HttpException(Response.error<Any>(403, "".toResponseBody()))
        coEvery { repository.syncItemCheck("list-1", "item-1", true) } throws error
        coEvery { repository.markCheckOperationFailedPermanent(any(), any(), any(), any()) } returns Unit

        val result = useCase("list-1", "item-1", true)

        assertTrue(result is SyncCheckResult.PermanentFailure)
        coVerify(exactly = 1) { repository.markCheckOperationFailedPermanent("list-1", "item-1", true, any()) }
        coVerify(exactly = 0) { repository.enqueuePendingCheckOperation(any(), any(), any(), any()) }
    }

    @Test
    fun `invoke marks permanent failure on 404 error`() = runTest {
        val error = HttpException(Response.error<Any>(404, "".toResponseBody()))
        coEvery { repository.syncItemCheck("list-1", "item-1", true) } throws error
        coEvery { repository.markCheckOperationFailedPermanent(any(), any(), any(), any()) } returns Unit

        val result = useCase("list-1", "item-1", true)

        assertTrue(result is SyncCheckResult.PermanentFailure)
        coVerify(exactly = 1) { repository.markCheckOperationFailedPermanent("list-1", "item-1", true, any()) }
    }

    @Test
    fun `invoke defaults to transient failure on unknown exception`() = runTest {
        coEvery { repository.syncItemCheck("list-1", "item-1", true) } throws IllegalStateException("boom")
        coEvery { repository.enqueuePendingCheckOperation(any(), any(), any(), any()) } returns Unit

        val result = useCase("list-1", "item-1", true)

        assertTrue(result is SyncCheckResult.TransientFailure)
        coVerify(exactly = 1) { repository.enqueuePendingCheckOperation("list-1", "item-1", true, any()) }
    }

    @Test
    fun `invoke validates list id`() = runTest {
        try {
            useCase("", "item-1", true)
            kotlin.test.fail("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertEquals("El ID de la lista no puede estar vacío", e.message)
        }
    }
}
