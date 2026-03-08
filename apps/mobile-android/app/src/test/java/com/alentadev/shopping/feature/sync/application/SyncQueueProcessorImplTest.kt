package com.alentadev.shopping.feature.sync.application

import com.alentadev.shopping.core.data.database.dao.PendingSyncDao
import com.alentadev.shopping.core.data.database.entity.PendingSyncEntity
import com.alentadev.shopping.feature.listdetail.data.remote.ListDetailRemoteDataSource
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
        val remoteDataSource = mockk<ListDetailRemoteDataSource>()
        val backoffPolicy = mockk<SyncBackoffPolicy>(relaxed = true)
        val pendingOps = listOf(
            PendingSyncEntity("op-1", "list-1", "item-1", true, localUpdatedAt = 10L),
            PendingSyncEntity("op-2", "list-1", "item-2", false, localUpdatedAt = 20L)
        )

        coEvery { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() } returns pendingOps
        coEvery { remoteDataSource.updateItemCheck(any(), any(), any()) } returns Unit
        val processor = SyncQueueProcessorImpl(
            pendingSyncDao = pendingSyncDao,
            remoteDataSource = remoteDataSource,
            backoffPolicy = backoffPolicy
        )

        processor.flushPendingSync()

        coVerify(ordering = io.mockk.Ordering.SEQUENCE) {
            remoteDataSource.updateItemCheck("list-1", "item-1", true)
            pendingSyncDao.delete("op-1")
            remoteDataSource.updateItemCheck("list-1", "item-2", false)
            pendingSyncDao.delete("op-2")
        }
    }

    @Test
    fun `flushPendingSync replays complete-list command and deletes on success`() = runTest {
        val pendingSyncDao = mockk<PendingSyncDao>()
        val remoteDataSource = mockk<ListDetailRemoteDataSource>()
        val backoffPolicy = mockk<SyncBackoffPolicy>(relaxed = true)
        val pendingOps = listOf(
            PendingSyncEntity(
                operationId = "op-1",
                listId = "list-1",
                itemId = PendingSyncEntity.COMPLETE_LIST_ITEM_ID,
                checked = false,
                commandType = PendingSyncEntity.COMMAND_COMPLETE_LIST,
                checkedItemIdsPayload = "item-1,item-2",
                localUpdatedAt = 10L
            )
        )

        coEvery { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() } returns pendingOps
        coEvery { remoteDataSource.completeList("list-1", listOf("item-1", "item-2")) } returns Unit

        val processor = SyncQueueProcessorImpl(
            pendingSyncDao = pendingSyncDao,
            remoteDataSource = remoteDataSource,
            backoffPolicy = backoffPolicy
        )

        processor.flushPendingSync()

        coVerify(exactly = 1) { remoteDataSource.completeList("list-1", listOf("item-1", "item-2")) }
        coVerify(exactly = 1) { pendingSyncDao.delete("op-1") }
    }

    @Test
    fun `flushPendingSync increments retry and applies backoff on transient errors`() = runTest {
        val pendingSyncDao = mockk<PendingSyncDao>()
        val remoteDataSource = mockk<ListDetailRemoteDataSource>()
        val backoffPolicy = mockk<SyncBackoffPolicy>()
        val pendingOperation = PendingSyncEntity("op-1", "list-1", "item-1", true, localUpdatedAt = 10L, retryCount = 1)

        coEvery { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() } returns listOf(pendingOperation)
        coEvery { remoteDataSource.updateItemCheck(any(), any(), any()) } throws IOException("network")
        coEvery { pendingSyncDao.incrementRetry(any()) } returns Unit
        coEvery { backoffPolicy.delayMillisFor(retryCount = 2) } returns 500L

        val processor = SyncQueueProcessorImpl(
            pendingSyncDao = pendingSyncDao,
            remoteDataSource = remoteDataSource,
            backoffPolicy = backoffPolicy
        )

        processor.flushPendingSync()

        coVerify(exactly = 1) { pendingSyncDao.incrementRetry("op-1") }
        coVerify(exactly = 1) { backoffPolicy.delayMillisFor(2) }
        coVerify(exactly = 0) { pendingSyncDao.delete(any()) }
        coVerify(exactly = 0) { pendingSyncDao.markFailedPermanent(any()) }
    }

    @Test
    fun `flushPendingSync keeps complete-list pending and retryable when replay fails`() = runTest {
        val pendingSyncDao = mockk<PendingSyncDao>()
        val remoteDataSource = mockk<ListDetailRemoteDataSource>()
        val backoffPolicy = mockk<SyncBackoffPolicy>()
        val pendingOperation = PendingSyncEntity(
            operationId = "op-1",
            listId = "list-1",
            itemId = PendingSyncEntity.COMPLETE_LIST_ITEM_ID,
            checked = false,
            commandType = PendingSyncEntity.COMMAND_COMPLETE_LIST,
            checkedItemIdsPayload = "item-1",
            localUpdatedAt = 10L,
            retryCount = 0
        )

        coEvery { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() } returns listOf(pendingOperation)
        coEvery { remoteDataSource.completeList(any(), any()) } throws IOException("network")
        coEvery { pendingSyncDao.incrementRetry("op-1") } returns Unit
        coEvery { backoffPolicy.delayMillisFor(1) } returns 100L

        val processor = SyncQueueProcessorImpl(
            pendingSyncDao = pendingSyncDao,
            remoteDataSource = remoteDataSource,
            backoffPolicy = backoffPolicy
        )

        processor.flushPendingSync()

        coVerify(exactly = 1) { pendingSyncDao.incrementRetry("op-1") }
        coVerify(exactly = 0) { pendingSyncDao.delete("op-1") }
        coVerify(exactly = 0) { pendingSyncDao.markFailedPermanent("op-1") }
    }

    @Test
    fun `flushPendingSync marks operation as failed permanent on permanent HTTP errors`() = runTest {
        val pendingSyncDao = mockk<PendingSyncDao>()
        val remoteDataSource = mockk<ListDetailRemoteDataSource>()
        val backoffPolicy = mockk<SyncBackoffPolicy>(relaxed = true)
        val pendingOperation = PendingSyncEntity("op-1", "list-1", "item-1", true, localUpdatedAt = 10L)

        coEvery { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() } returns listOf(pendingOperation)
        coEvery { remoteDataSource.updateItemCheck(any(), any(), any()) } throws permanentHttpException(404)
        coEvery { pendingSyncDao.markFailedPermanent(any()) } returns Unit

        val processor = SyncQueueProcessorImpl(
            pendingSyncDao = pendingSyncDao,
            remoteDataSource = remoteDataSource,
            backoffPolicy = backoffPolicy
        )

        processor.flushPendingSync()

        coVerify(exactly = 1) { pendingSyncDao.markFailedPermanent("op-1") }
        coVerify(exactly = 0) { pendingSyncDao.delete(any()) }
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
    fun `flushPendingSync normalizes complete-list payload before replaying command`() = runTest {
        val pendingSyncDao = mockk<PendingSyncDao>()
        val remoteDataSource = mockk<ListDetailRemoteDataSource>()
        val backoffPolicy = mockk<SyncBackoffPolicy>(relaxed = true)
        val pendingOperation = PendingSyncEntity(
            operationId = "op-1",
            listId = "list-1",
            itemId = PendingSyncEntity.COMPLETE_LIST_ITEM_ID,
            checked = false,
            commandType = PendingSyncEntity.COMMAND_COMPLETE_LIST,
            checkedItemIdsPayload = " item-1, item-1, , item-2 ",
            localUpdatedAt = 10L
        )

        coEvery { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() } returns listOf(pendingOperation)
        coEvery { remoteDataSource.completeList("list-1", listOf("item-1", "item-2")) } returns Unit
        coEvery { pendingSyncDao.delete("op-1") } returns Unit

        val processor = SyncQueueProcessorImpl(
            pendingSyncDao = pendingSyncDao,
            remoteDataSource = remoteDataSource,
            backoffPolicy = backoffPolicy
        )

        processor.flushPendingSync()

        coVerify(exactly = 1) { remoteDataSource.completeList("list-1", listOf("item-1", "item-2")) }
        coVerify(exactly = 1) { pendingSyncDao.delete("op-1") }
    }

    @Test
    fun `hasPendingSyncOperations returns true when dao has pending operations`() = runTest {
        val pendingSyncDao = mockk<PendingSyncDao>()
        val remoteDataSource = mockk<ListDetailRemoteDataSource>()
        val backoffPolicy = mockk<SyncBackoffPolicy>(relaxed = true)

        coEvery { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() } returns listOf(
            PendingSyncEntity("op-1", "list-1", "item-1", true, localUpdatedAt = 10L)
        )

        val processor = SyncQueueProcessorImpl(
            pendingSyncDao = pendingSyncDao,
            remoteDataSource = remoteDataSource,
            backoffPolicy = backoffPolicy
        )

        val hasPending = processor.hasPendingSyncOperations()

        assertTrue(hasPending)
    }

}
