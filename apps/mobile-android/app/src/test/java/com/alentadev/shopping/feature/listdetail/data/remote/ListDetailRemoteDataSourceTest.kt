package com.alentadev.shopping.feature.listdetail.data.remote

import com.alentadev.shopping.feature.listdetail.data.dto.ListDetailDto
import com.alentadev.shopping.feature.listdetail.data.dto.ListItemDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class ListDetailRemoteDataSourceTest {
    private lateinit var api: ListDetailApi
    private lateinit var dataSource: ListDetailRemoteDataSource

    @Before
    fun setup() {
        api = mockk()
        dataSource = ListDetailRemoteDataSource(api)
    }

    @Test
    fun `getListDetail returns mapped ListDetail from API`() = runTest {
        // Arrange
        val listId = "list-123"
        val apiDto = ListDetailDto(
            id = listId,
            title = "Supermercado",
            status = "ACTIVE",
            isEditing = false,
            activatedAt = "2026-01-01T00:00:00.000Z",
            itemCount = 1,
            items = listOf(
                ListItemDto(
                    id = "item-1",
                    kind = "catalog",
                    name = "Leche",
                    qty = 1.0,
                    checked = false,
                    source = "mercadona",
                    sourceProductId = "123",
                    thumbnail = "https://cdn.example.com/milk.png",
                    price = 1.25,
                    unitSize = 1.0,
                    unitFormat = "L",
                    unitPrice = 1.25,
                    isApproxSize = false,
                    updatedAt = "2024-01-01T00:00:00.000Z"
                )
            ),
            updatedAt = "2024-01-01T00:00:00.000Z"
        )

        coEvery { api.getListDetail(listId) } returns apiDto

        // Act
        val result = dataSource.getListDetail(listId)

        // Assert
        assertEquals(listId, result.id)
        assertEquals("Supermercado", result.title)
        assertEquals(1, result.items.size)
        assertEquals("Leche", result.items[0].name)
    }

    @Test
    fun `getListDetail maps catalog items correctly`() = runTest {
        // Arrange
        val listId = "list-456"
        val apiDto = ListDetailDto(
            id = listId,
            title = "Compra",
            status = "ACTIVE",
            itemCount = 1,
            items = listOf(
                ListItemDto(
                    id = "item-1",
                    kind = "catalog",
                    name = "Leche",
                    qty = 2.0,
                    checked = false,
                    source = "mercadona",
                    sourceProductId = "prod-1",
                    thumbnail = "https://example.com/leche.jpg",
                    price = 1.50,
                    unitSize = 1.0,
                    unitFormat = "L",
                    unitPrice = 1.50,
                    isApproxSize = false,
                    updatedAt = "2026-02-25T10:00:00Z"
                )
            ),
            updatedAt = "2026-02-25T10:00:00Z"
        )

        coEvery { api.getListDetail(listId) } returns apiDto

        // Act
        val result = dataSource.getListDetail(listId)
        val item = result.items[0]

        // Assert
        assertTrue(item is com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem)
        item as com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
        assertNotNull(item.price)
        assertEquals(1.50, item.price!!, 0.01)
        assertEquals("mercadona", item.source)
        assertEquals("prod-1", item.sourceProductId)
    }

    @Test
    fun `getListDetail maps manual items correctly`() = runTest {
        // Arrange
        val listId = "list-789"
        val apiDto = ListDetailDto(
            id = listId,
            title = "Compra",
            status = "ACTIVE",
            itemCount = 1,
            items = listOf(
                ListItemDto(
                    id = "item-1",
                    kind = "manual",
                    name = "Pan",
                    qty = 1.0,
                    checked = false,
                    note = "Integral",
                    updatedAt = "2026-02-25T10:00:00Z"
                )
            ),
            updatedAt = "2026-02-25T10:00:00Z"
        )

        coEvery { api.getListDetail(listId) } returns apiDto

        // Act
        val result = dataSource.getListDetail(listId)
        val item = result.items[0]

        // Assert
        assertTrue(item is com.alentadev.shopping.feature.listdetail.domain.entity.ManualItem)
        item as com.alentadev.shopping.feature.listdetail.domain.entity.ManualItem
        assertEquals("Integral", item.note)
    }

    @Test
    fun `getListDetail throws exception on API error`() = runTest {
        // Arrange
        val listId = "list-error"
        val apiError = Exception("API Error")

        coEvery { api.getListDetail(listId) } throws apiError

        // Act & Assert
        try {
            dataSource.getListDetail(listId)
            fail("Expected Exception")
        } catch (e: Exception) {
            assertEquals("API Error", e.message)
        }
    }
}

