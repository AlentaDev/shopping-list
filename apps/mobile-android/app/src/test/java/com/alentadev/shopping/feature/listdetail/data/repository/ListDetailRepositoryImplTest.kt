package com.alentadev.shopping.feature.listdetail.data.repository

import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import com.alentadev.shopping.feature.listdetail.data.remote.ListDetailRemoteDataSource
import com.alentadev.shopping.feature.listdetail.data.local.ListDetailLocalDataSource
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class ListDetailRepositoryImplTest {
    private lateinit var remoteDataSource: ListDetailRemoteDataSource
    private lateinit var localDataSource: ListDetailLocalDataSource
    private lateinit var repository: ListDetailRepositoryImpl

    @Before
    fun setup() {
        remoteDataSource = mockk()
        localDataSource = mockk()
        repository = ListDetailRepositoryImpl(remoteDataSource, localDataSource)
    }

    @Test
    fun `getListDetail returns flow from local data source`() = runTest {
        // Arrange
        val listId = "list-123"
        val items = listOf(
            CatalogItem(
                id = "item-1",
                name = "Leche",
                qty = 2.0,
                checked = false,
                updatedAt = "2026-02-25T10:00:00Z",
                thumbnail = "https://example.com/leche.jpg",
                price = 1.50,
                unitSize = 1.0,
                unitFormat = "L",
                unitPrice = 1.50,
                isApproxSize = false,
                source = "mercadona",
                sourceProductId = "prod-1"
            )
        )
        val listDetail = ListDetail(
            id = listId,
            title = "Supermercado",
            items = items,
            updatedAt = "2026-02-25T10:00:00Z"
        )

        coEvery { remoteDataSource.getListDetail(listId) } returns listDetail
        coEvery { localDataSource.saveListDetail(listDetail) } returns Unit
        coEvery { localDataSource.getListDetailFlow(listId) } returns flowOf(listDetail)

        // Act
        val result = mutableListOf<ListDetail?>()
        repository.getListDetail(listId).collect { result.add(it) }

        // Assert
        assertEquals(1, result.size)
        assertEquals(listId, result[0]?.id)
        assertEquals("Supermercado", result[0]?.title)
    }

    @Test
    fun `getListDetail saves remote data to local cache`() = runTest {
        // Arrange
        val listId = "list-456"
        val listDetail = ListDetail(
            id = listId,
            title = "Compra semanal",
            items = emptyList(),
            updatedAt = "2026-02-25T10:00:00Z"
        )

        coEvery { remoteDataSource.getListDetail(listId) } returns listDetail
        coEvery { localDataSource.saveListDetail(listDetail) } returns Unit
        coEvery { localDataSource.getListDetailFlow(listId) } returns flowOf(listDetail)

        // Act
        repository.getListDetail(listId).collect {}

        // Assert
        coVerify { localDataSource.saveListDetail(listDetail) }
    }

    @Test
    fun `updateItemChecked updates item locally when exists`() = runTest {
        // Arrange
        val listId = "list-123"
        val itemId = "item-1"
        val items = listOf(
            CatalogItem(
                id = itemId,
                name = "Leche",
                qty = 2.0,
                checked = false,
                updatedAt = "2026-02-25T10:00:00Z",
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
        val listDetail = ListDetail(
            id = listId,
            title = "Supermercado",
            items = items,
            updatedAt = "2026-02-25T10:00:00Z"
        )

        coEvery { localDataSource.getListDetail(listId) } returns listDetail
        coEvery { localDataSource.updateItemChecked(itemId, true) } returns Unit

        // Act
        repository.updateItemChecked(listId, itemId, true)

        // Assert
        coVerify { localDataSource.updateItemChecked(itemId, true) }
    }

    @Test
    fun `updateItemChecked throws when list not found`() = runTest {
        // Arrange
        val listId = "list-999"
        val itemId = "item-1"

        coEvery { localDataSource.getListDetail(listId) } returns null

        // Act & Assert
        try {
            repository.updateItemChecked(listId, itemId, true)
            fail("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message?.contains("Lista no encontrada") ?: false)
        }
    }

    @Test
    fun `updateItemChecked throws when item not found`() = runTest {
        // Arrange
        val listId = "list-123"
        val itemId = "item-999"
        val listDetail = ListDetail(
            id = listId,
            title = "Supermercado",
            items = emptyList(),
            updatedAt = "2026-02-25T10:00:00Z"
        )

        coEvery { localDataSource.getListDetail(listId) } returns listDetail

        // Act & Assert
        try {
            repository.updateItemChecked(listId, itemId, true)
            fail("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertTrue(e.message?.contains("Item no encontrado") ?: false)
        }
    }

    @Test
    fun `refreshListDetail fetches from remote and saves to local`() = runTest {
        // Arrange
        val listId = "list-123"
        val listDetail = ListDetail(
            id = listId,
            title = "Supermercado",
            items = emptyList(),
            updatedAt = "2026-02-25T10:00:00Z"
        )

        coEvery { remoteDataSource.getListDetail(listId) } returns listDetail
        coEvery { localDataSource.saveListDetail(listDetail) } returns Unit

        // Act
        repository.refreshListDetail(listId)

        // Assert
        coVerify {
            remoteDataSource.getListDetail(listId)
            localDataSource.saveListDetail(listDetail)
        }
    }

    @Test
    fun `refreshListDetail throws when network error`() = runTest {
        // Arrange
        val listId = "list-123"
        val networkError = Exception("Network error")

        coEvery { remoteDataSource.getListDetail(listId) } throws networkError

        // Act & Assert
        try {
            repository.refreshListDetail(listId)
            fail("Expected Exception")
        } catch (e: Exception) {
            assertEquals("Network error", e.message)
        }
    }
}

