package com.alentadev.shopping.feature.listdetail.data.repository

import com.alentadev.shopping.core.data.network.DataSource
import com.alentadev.shopping.core.data.network.OfflineFirstExecutor
import com.alentadev.shopping.core.data.network.OfflineFirstResult
import com.alentadev.shopping.core.network.ConnectivityGate
import com.alentadev.shopping.feature.listdetail.data.local.ListDetailLocalDataSource
import com.alentadev.shopping.feature.listdetail.data.remote.ListDetailRemoteDataSource
import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test

class ListDetailRepositoryImplTest {
    private lateinit var remoteDataSource: ListDetailRemoteDataSource
    private lateinit var localDataSource: ListDetailLocalDataSource
    private lateinit var offlineFirstExecutor: OfflineFirstExecutor
    private lateinit var connectivityGate: ConnectivityGate
    private lateinit var repository: ListDetailRepositoryImpl

    @Before
    fun setup() {
        remoteDataSource = mockk()
        localDataSource = mockk()
        offlineFirstExecutor = mockk()
        connectivityGate = mockk()
        repository = ListDetailRepositoryImpl(remoteDataSource, localDataSource, offlineFirstExecutor, connectivityGate)
    }

    @Test
    fun `getListDetail returns flow from local data source`() = runTest {
        val listId = "list-123"
        val listDetail = ListDetail(id = listId, title = "Compra semanal", items = emptyList(), updatedAt = "2026")

        coEvery { remoteDataSource.getListDetail(listId) } returns listDetail
        coEvery { localDataSource.saveListDetail(listDetail) } returns Unit
        coEvery { localDataSource.getListDetailFlow(listId) } returns flowOf(listDetail)
        coEvery {
            offlineFirstExecutor.execute<ListDetail>(
                connectivityGate = any(),
                fetchRemote = any(),
                saveRemote = any(),
                readLocal = any()
            )
        } coAnswers {
            val fetchRemote = arg<suspend () -> ListDetail>(1)
            val saveRemote = arg<suspend (ListDetail) -> Unit>(2)
            val remoteValue = fetchRemote()
            saveRemote(remoteValue)
            OfflineFirstResult.Success(remoteValue, DataSource.REMOTE)
        }

        repository.getListDetail(listId).collect {}

        coVerify { localDataSource.saveListDetail(listDetail) }
    }

    @Test
    fun `getListDetail delegates fallback decision to offline executor`() = runTest {
        val listId = "list-remote-fail"
        val cached = ListDetail(id = listId, title = "Cached detail", items = emptyList(), updatedAt = "2026")

        coEvery { localDataSource.getListDetailFlow(listId) } returns flowOf(cached)
        coEvery {
            offlineFirstExecutor.execute<ListDetail>(
                connectivityGate = connectivityGate,
                fetchRemote = any(),
                saveRemote = any(),
                readLocal = any()
            )
        } returns OfflineFirstResult.Success(cached, DataSource.CACHE)

        val result = mutableListOf<ListDetail?>()
        repository.getListDetail(listId).collect { result.add(it) }

        assertEquals(1, result.size)
        assertEquals("Cached detail", result.first()?.title)
    }

    @Test
    fun `updateItemChecked updates item locally when exists`() = runTest {
        val listId = "list-123"
        val itemId = "item-1"
        val items = listOf(
            CatalogItem(
                id = itemId,
                name = "Leche",
                qty = 2.0,
                checked = false,
                updatedAt = "2026",
                thumbnail = null,
                price = 1.50,
                unitSize = null,
                unitFormat = null,
                unitPrice = null,
                isApproxSize = false,
                source = "mercadona",
                sourceProductId = "prod-1"
            )
        )
        val listDetail = ListDetail(id = listId, title = "Supermercado", items = items, updatedAt = "2026")

        coEvery { localDataSource.getListDetail(listId) } returns listDetail
        coEvery { localDataSource.updateItemChecked(itemId, true) } returns Unit

        repository.updateItemChecked(listId, itemId, true)

        coVerify { localDataSource.updateItemChecked(itemId, true) }
    }

    @Test
    fun `updateItemChecked throws when list not found`() = runTest {
        coEvery { localDataSource.getListDetail("list-999") } returns null

        try {
            repository.updateItemChecked("list-999", "item-1", true)
            fail("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message?.contains("Lista no encontrada") ?: false)
        }
    }

    @Test
    fun `updateItemChecked throws when item not found`() = runTest {
        val listDetail = ListDetail(id = "list-123", title = "Supermercado", items = emptyList(), updatedAt = "2026")
        coEvery { localDataSource.getListDetail("list-123") } returns listDetail

        try {
            repository.updateItemChecked("list-123", "item-999", true)
            fail("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message?.contains("Item no encontrado") ?: false)
        }
    }

    @Test
    fun `syncItemCheck delegates to remote`() = runTest {
        coEvery { remoteDataSource.updateItemCheck("list-1", "item-1", true) } returns Unit

        repository.syncItemCheck("list-1", "item-1", true)

        coVerify(exactly = 1) { remoteDataSource.updateItemCheck("list-1", "item-1", true) }
    }

    @Test
    fun `enqueuePendingCheckOperation delegates to local datasource`() = runTest {
        coEvery { localDataSource.enqueuePendingCheckOperation("list-1", "item-1", true, 1234L) } returns Unit

        repository.enqueuePendingCheckOperation("list-1", "item-1", true, 1234L)

        coVerify(exactly = 1) { localDataSource.enqueuePendingCheckOperation("list-1", "item-1", true, 1234L) }
    }

    @Test
    fun `markCheckOperationFailedPermanent delegates to local datasource`() = runTest {
        coEvery { localDataSource.markPendingCheckFailedPermanent("list-1", "item-1", false, 1234L) } returns Unit

        repository.markCheckOperationFailedPermanent("list-1", "item-1", false, 1234L)

        coVerify(exactly = 1) { localDataSource.markPendingCheckFailedPermanent("list-1", "item-1", false, 1234L) }
    }

    @Test
    fun `refreshListDetail fetches from remote and saves to local`() = runTest {
        val listDetail = ListDetail(id = "list-123", title = "Supermercado", items = emptyList(), updatedAt = "2026")
        coEvery { remoteDataSource.getListDetail("list-123") } returns listDetail
        coEvery { localDataSource.saveListDetail(listDetail) } returns Unit

        repository.refreshListDetail("list-123")

        coVerify {
            remoteDataSource.getListDetail("list-123")
            localDataSource.saveListDetail(listDetail)
        }
    }
}
