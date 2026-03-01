package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import com.alentadev.shopping.feature.listdetail.domain.entity.ManualItem
import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class GetListDetailUseCaseTest {
    private lateinit var repository: ListDetailRepository
    private lateinit var useCase: GetListDetailUseCase

    @Before
    fun setup() {
        repository = mockk()
        useCase = GetListDetailUseCase(repository)
    }

    @Test
    fun `invoke returns list detail from repository`() = runTest {
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

        coEvery { repository.getListDetail(listId) } returns flowOf(listDetail)

        // Act
        val result = mutableListOf<ListDetail>()
        useCase(listId).collect { result.add(it) }

        // Assert
        assertEquals(1, result.size)
        assertEquals(listId, result[0].id)
        assertEquals("Supermercado", result[0].title)
        assertEquals(1, result[0].items.size)
    }

    @Test
    fun `invoke returns list detail with multiple items`() = runTest {
        // Arrange
        val listId = "list-456"
        val items = listOf(
            ManualItem(
                id = "item-1",
                name = "Pan",
                qty = 1.0,
                checked = true,
                updatedAt = "2026-02-25T10:00:00Z"
            ),
            CatalogItem(
                id = "item-2",
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
                sourceProductId = "prod-2"
            )
        )
        val listDetail = ListDetail(
            id = listId,
            title = "Compra semanal",
            items = items,
            updatedAt = "2026-02-25T10:00:00Z"
        )

        coEvery { repository.getListDetail(listId) } returns flowOf(listDetail)

        // Act
        val result = mutableListOf<ListDetail>()
        useCase(listId).collect { result.add(it) }

        // Assert
        assertEquals(1, result.size)
        assertEquals(2, result[0].items.size)
        assertTrue(result[0].items[0] is ManualItem)
        assertTrue(result[0].items[1] is CatalogItem)
    }

    @Test
    fun `invoke throws exception when list id is blank`() = runTest {
        // Arrange
        val listId = ""

        // Act & Assert
        try {
            useCase(listId).collect {}
            fail("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertEquals("El ID de la lista no puede estar vacío", e.message)
        }
    }

    @Test
    fun `invoke throws exception when list id is empty`() = runTest {
        // Arrange
        val listId = "   "

        // Act & Assert
        try {
            useCase(listId).collect {}
            fail("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertEquals("El ID de la lista no puede estar vacío", e.message)
        }
    }

    @Test
    fun `invoke propagates repository exceptions`() = runTest {
        // Arrange
        val listId = "list-999"
        val expectedException = RuntimeException("Network error")
        coEvery { repository.getListDetail(listId) } throws expectedException

        // Act & Assert
        try {
            useCase(listId).collect {}
            fail("Expected RuntimeException")
        } catch (e: RuntimeException) {
            assertEquals("Network error", e.message)
        }
    }
}

