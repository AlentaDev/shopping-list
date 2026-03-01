package com.alentadev.shopping.feature.lists.data.local

import com.alentadev.shopping.core.data.database.dao.ListEntityDao
import com.alentadev.shopping.core.data.database.entity.ListEntity
import com.alentadev.shopping.feature.lists.domain.entity.ListStatus
import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

class ListsLocalDataSourceTest {
    private lateinit var listDao: ListEntityDao
    private lateinit var dataSource: ListsLocalDataSource

    @Before
    fun setup() {
        listDao = mockk()
        dataSource = ListsLocalDataSource(listDao)
    }

    @Test
    fun `saveLists persists itemCount in local entity`() = runTest {
        val lists = listOf(
            ShoppingList(
                id = "list-1",
                title = "Super",
                status = ListStatus.ACTIVE,
                updatedAt = 1000L,
                itemCount = 7
            )
        )
        val captured = slot<List<ListEntity>>()
        coEvery { listDao.insertAll(capture(captured)) } returns Unit

        dataSource.saveLists(lists)

        coVerify(exactly = 1) { listDao.insertAll(any()) }
        assertEquals(7, captured.captured.first().itemCount)
    }

    @Test
    fun `getActiveListsOnce returns itemCount from local entity`() = runTest {
        coEvery { listDao.getListsByStatus("ACTIVE") } returns listOf(
            ListEntity(
                id = "list-1",
                title = "Super",
                status = "ACTIVE",
                updatedAt = "1000",
                itemCount = 4
            )
        )

        val result = dataSource.getActiveListsOnce()

        assertEquals(1, result.size)
        assertEquals(4, result.first().itemCount)
    }
}
