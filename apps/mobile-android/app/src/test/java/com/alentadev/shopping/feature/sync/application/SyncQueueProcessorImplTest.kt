package com.alentadev.shopping.feature.sync.application

import com.alentadev.shopping.core.data.database.dao.PendingSyncDao
import com.alentadev.shopping.core.data.database.entity.PendingSyncEntity
import com.alentadev.shopping.feature.listdetail.data.remote.ListDetailApi
import com.alentadev.shopping.feature.listdetail.data.remote.UpdateItemCheckRequest
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import java.io.IOException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response

@OptIn(ExperimentalCoroutinesApi::class)
class SyncQueueProcessorImplTest {

    @Test
    fun `flushPendingSync sends pending operations in order and deletes on success`() = runTest {
        val pendingSyncDao = mockk<PendingSyncDao>()
        val listDetailApi = mockk<ListDetailApi>()
        val backoffPolicy = mockk<SyncBackoffPolicy>(relaxed = true)
        val pendingOps = listOf(
            PendingSyncEntity("op-1", "list-1", "item-1", true, localUpdatedAt = 10L),
            PendingSyncEntity("op-2", "list-1", "item-2", false, localUpdatedAt = 20L)
        )

        coEvery { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() } returns pendingOps
        coEvery { listDetailApi.updateItemCheck(any(), any(), any()) } returns mockk()
        val processor = SyncQueueProcessorImpl(
            pendingSyncDao = pendingSyncDao,
            listDetailApi = listDetailApi,
            backoffPolicy = backoffPolicy
        )

        processor.flushPendingSync()

        coVerify(ordering = io.mockk.Ordering.SEQUENCE) {
            listDetailApi.updateItemCheck("list-1", "item-1", UpdateItemCheckRequest(true))
            pendingSyncDao.delete("op-1")
            listDetailApi.updateItemCheck("list-1", "item-2", UpdateItemCheckRequest(false))
            pendingSyncDao.delete("op-2")
        }
    }

    @Test
    fun `flushPendingSync increments retry and applies backoff on transient errors`() = runTest {
        val pendingSyncDao = mockk<PendingSyncDao>()
        val listDetailApi = mockk<ListDetailApi>()
        val backoffPolicy = mockk<SyncBackoffPolicy>()
        val pendingOperation = PendingSyncEntity("op-1", "list-1", "item-1", true, localUpdatedAt = 10L, retryCount = 1)

        coEvery { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() } returns listOf(pendingOperation)
        coEvery { listDetailApi.updateItemCheck(any(), any(), any()) } throws IOException("network")
        coEvery { pendingSyncDao.incrementRetry(any()) } returns Unit
        coEvery { backoffPolicy.delayMillisFor(retryCount = 2) } returns 500L

        val processor = SyncQueueProcessorImpl(
            pendingSyncDao = pendingSyncDao,
            listDetailApi = listDetailApi,
            backoffPolicy = backoffPolicy
        )

        processor.flushPendingSync()

        coVerify(exactly = 1) { pendingSyncDao.incrementRetry("op-1") }
        coVerify(exactly = 1) { backoffPolicy.delayMillisFor(2) }
        coVerify(exactly = 0) { pendingSyncDao.markFailedPermanent(any()) }
    }

    @Test
    fun `flushPendingSync marks operation as failed permanent on permanent HTTP errors`() = runTest {
        val pendingSyncDao = mockk<PendingSyncDao>()
        val listDetailApi = mockk<ListDetailApi>()
        val backoffPolicy = mockk<SyncBackoffPolicy>(relaxed = true)
        val pendingOperation = PendingSyncEntity("op-1", "list-1", "item-1", true, localUpdatedAt = 10L)

        coEvery { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() } returns listOf(pendingOperation)
        coEvery { listDetailApi.updateItemCheck(any(), any(), any()) } throws permanentHttpException(404)
        coEvery { pendingSyncDao.markFailedPermanent(any()) } returns Unit

        val processor = SyncQueueProcessorImpl(
            pendingSyncDao = pendingSyncDao,
            listDetailApi = listDetailApi,
            backoffPolicy = backoffPolicy
        )

        processor.flushPendingSync()

        coVerify(exactly = 1) { pendingSyncDao.markFailedPermanent("op-1") }
        coVerify(exactly = 0) { pendingSyncDao.incrementRetry(any()) }
        coVerify(exactly = 0) { backoffPolicy.delayMillisFor(any()) }
    }

    private fun permanentHttpException(code: Int): HttpException {
        val response = Response.error<Any>(
            code,
            "error".toResponseBody("text/plain".toMediaType())
        )
        return HttpException(response)
    }


    @Test
    fun `hasPendingSyncOperations returns true when dao has pending operations`() = runTest {
        val pendingSyncDao = mockk<PendingSyncDao>()
        val listDetailApi = mockk<ListDetailApi>()
        val backoffPolicy = mockk<SyncBackoffPolicy>(relaxed = true)

        coEvery { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() } returns listOf(
            PendingSyncEntity("op-1", "list-1", "item-1", true, localUpdatedAt = 10L)
        )

        val processor = SyncQueueProcessorImpl(
            pendingSyncDao = pendingSyncDao,
            listDetailApi = listDetailApi,
            backoffPolicy = backoffPolicy
        )

        val hasPending = processor.hasPendingSyncOperations()

        assertTrue(hasPending)
    }

}
