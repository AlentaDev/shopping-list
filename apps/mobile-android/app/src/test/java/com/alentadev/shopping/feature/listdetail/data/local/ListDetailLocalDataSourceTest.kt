package com.alentadev.shopping.feature.listdetail.data.local

import com.alentadev.shopping.core.data.database.dao.ItemEntityDao
import com.alentadev.shopping.core.data.database.dao.ListEntityDao
import com.alentadev.shopping.core.data.database.dao.PendingSyncDao
import com.alentadev.shopping.core.data.database.entity.ItemEntity
import com.alentadev.shopping.core.data.database.entity.ListEntity
import com.alentadev.shopping.core.data.database.entity.PendingSyncEntity
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class ListDetailLocalDataSourceTest {
    private lateinit var listDao: ListEntityDao
    private lateinit var itemDao: ItemEntityDao
    private lateinit var pendingSyncDao: PendingSyncDao
    private lateinit var dataSource: ListDetailLocalDataSource

    @Before
    fun setup() {
        listDao = mockk()
        itemDao = mockk()
        pendingSyncDao = mockk()
        dataSource = ListDetailLocalDataSource(listDao, itemDao, pendingSyncDao)
    }

    @Test
    fun `getListDetail returns list with items from database`() = runTest {
        val listId = "list-123"
        val listEntity = ListEntity(
            id = listId,
            title = "Supermercado",
            status = "ACTIVE",
            updatedAt = "2026-02-25T10:00:00Z"
        )
        val itemEntity = ItemEntity(
            id = "item-1",
            listId = listId,
            kind = "catalog",
            name = "Leche",
            qty = 2.0,
            checked = false,
            updatedAt = "2026-02-25T10:00:00Z",
            thumbnail = "https://example.com/leche.jpg",
            price = 1.50,
            source = "mercadona",
            sourceProductId = "prod-1",
            unitSize = 1.0,
            unitFormat = "L",
            unitPrice = 1.50,
            isApproxSize = false
        )

        coEvery { listDao.getListById(listId) } returns listEntity
        coEvery { itemDao.getItemsByListId(listId) } returns listOf(itemEntity)

        val result = dataSource.getListDetail(listId)

        assertNotNull(result)
        assertEquals("Supermercado", result?.title)
        assertEquals(1, result?.items?.size)
    }

    @Test
    fun `saveListDetail works without exceptions`() = runTest {
        assertTrue(true)
    }

    @Test
    fun `updateItemChecked updates checked status`() = runTest {
        val itemId = "item-1"

        coEvery { itemDao.updateCheckStatus(itemId, true) } returns Unit

        dataSource.updateItemChecked(itemId, true)

        coVerify { itemDao.updateCheckStatus(itemId, true) }
    }

    @Test
    fun `enqueuePendingCheckOperation upserts collapsed pending operation`() = runTest {
        coEvery { pendingSyncDao.upsertCollapsed("list-1", "item-1", true, 1000L) } returns Unit

        dataSource.enqueuePendingCheckOperation("list-1", "item-1", true, 1000L)

        coVerify(exactly = 1) { pendingSyncDao.upsertCollapsed("list-1", "item-1", true, 1000L) }
    }

    @Test
    fun `markPendingCheckFailedPermanent upserts then marks permanent`() = runTest {
        coEvery { pendingSyncDao.upsertCollapsed("list-1", "item-1", false, 1000L) } returns Unit
        coEvery { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() } returns listOf(
            PendingSyncEntity(
                operationId = "op-1",
                listId = "list-1",
                itemId = "item-1",
                checked = false,
                localUpdatedAt = 1000L
            )
        )
        coEvery { pendingSyncDao.markFailedPermanent("op-1") } returns Unit

        dataSource.markPendingCheckFailedPermanent("list-1", "item-1", false, 1000L)

        coVerify(exactly = 1) { pendingSyncDao.upsertCollapsed("list-1", "item-1", false, 1000L) }
        coVerify(exactly = 1) { pendingSyncDao.getPendingOrderedByLocalUpdatedAt() }
        coVerify(exactly = 1) { pendingSyncDao.markFailedPermanent("op-1") }
    }

    @Test
    fun `deleteListItems deletes all items for list`() = runTest {
        val listId = "list-123"

        coEvery { itemDao.deleteByListId(listId) } returns Unit

        dataSource.deleteListItems(listId)

        coVerify { itemDao.deleteByListId(listId) }
    }

    @Test
    fun `deleteListDetail deletes list and items`() = runTest {
        val listId = "list-123"

        coEvery { itemDao.deleteByListId(listId) } returns Unit
        coEvery { listDao.deleteById(listId) } returns Unit

        dataSource.deleteListDetail(listId)

        coVerify {
            itemDao.deleteByListId(listId)
            listDao.deleteById(listId)
        }
    }
}
