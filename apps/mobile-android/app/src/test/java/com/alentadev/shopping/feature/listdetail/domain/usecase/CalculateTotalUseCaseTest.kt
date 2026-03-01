package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import com.alentadev.shopping.feature.listdetail.domain.entity.ManualItem
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class CalculateTotalUseCaseTest {
    private lateinit var useCase: CalculateTotalUseCase

    @Before
    fun setup() {
        useCase = CalculateTotalUseCase()
    }

    @Test
    fun `invoke calculates total for checked catalog items`() {
        // Arrange
        val items = listOf(
            CatalogItem(
                id = "item-1",
                name = "Leche",
                qty = 2.0,
                checked = true,
                updatedAt = "2026-02-25T10:00:00Z",
                thumbnail = null,
                price = 1.50,
                unitSize = null,
                unitFormat = null,
                unitPrice = null,
                isApproxSize = false,
                source = "mercadona",
                sourceProductId = "prod-1"
            ),
            CatalogItem(
                id = "item-2",
                name = "Pan",
                qty = 1.0,
                checked = true,
                updatedAt = "2026-02-25T10:00:00Z",
                thumbnail = null,
                price = 2.00,
                unitSize = null,
                unitFormat = null,
                unitPrice = null,
                isApproxSize = false,
                source = "mercadona",
                sourceProductId = "prod-2"
            )
        )
        val listDetail = ListDetail(
            id = "list-123",
            title = "Supermercado",
            items = items,
            updatedAt = "2026-02-25T10:00:00Z"
        )

        // Act
        val total = useCase(listDetail)

        // Assert
        // (1.50 * 2.0) + (2.00 * 1.0) = 3.0 + 2.0 = 5.0
        assertEquals(5.0, total, 0.01)
    }

    @Test
    fun `invoke returns zero when no items are checked`() {
        // Arrange
        val items = listOf(
            CatalogItem(
                id = "item-1",
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
            id = "list-123",
            title = "Supermercado",
            items = items,
            updatedAt = "2026-02-25T10:00:00Z"
        )

        // Act
        val total = useCase(listDetail)

        // Assert
        assertEquals(0.0, total, 0.01)
    }

    @Test
    fun `invoke ignores manual items`() {
        // Arrange
        val items = listOf(
            ManualItem(
                id = "item-1",
                name = "Pan casero",
                qty = 1.0,
                checked = true,
                updatedAt = "2026-02-25T10:00:00Z"
            ),
            CatalogItem(
                id = "item-2",
                name = "Leche",
                qty = 2.0,
                checked = true,
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
            id = "list-123",
            title = "Supermercado",
            items = items,
            updatedAt = "2026-02-25T10:00:00Z"
        )

        // Act
        val total = useCase(listDetail)

        // Assert
        // Solo cuenta el CatalogItem: 1.50 * 2.0 = 3.0
        assertEquals(3.0, total, 0.01)
    }

    @Test
    fun `invoke ignores catalog items without price`() {
        // Arrange
        val items = listOf(
            CatalogItem(
                id = "item-1",
                name = "Producto sin precio",
                qty = 2.0,
                checked = true,
                updatedAt = "2026-02-25T10:00:00Z",
                thumbnail = null,
                price = null, // Sin precio
                unitSize = null,
                unitFormat = null,
                unitPrice = null,
                isApproxSize = false,
                source = "mercadona",
                sourceProductId = "prod-1"
            ),
            CatalogItem(
                id = "item-2",
                name = "Leche",
                qty = 2.0,
                checked = true,
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
            id = "list-123",
            title = "Supermercado",
            items = items,
            updatedAt = "2026-02-25T10:00:00Z"
        )

        // Act
        val total = useCase(listDetail)

        // Assert
        // Solo cuenta el item con precio: 1.50 * 2.0 = 3.0
        assertEquals(3.0, total, 0.01)
    }

    @Test
    fun `invoke returns zero for empty list`() {
        // Arrange
        val listDetail = ListDetail(
            id = "list-123",
            title = "Lista vacía",
            items = emptyList(),
            updatedAt = "2026-02-25T10:00:00Z"
        )

        // Act
        val total = useCase(listDetail)

        // Assert
        assertEquals(0.0, total, 0.01)
    }

    @Test
    fun `invoke handles mixed checked and unchecked items`() {
        // Arrange
        val items = listOf(
            CatalogItem(
                id = "item-1",
                name = "Leche",
                qty = 2.0,
                checked = true,
                updatedAt = "2026-02-25T10:00:00Z",
                thumbnail = null,
                price = 1.50,
                unitSize = null,
                unitFormat = null,
                unitPrice = null,
                isApproxSize = false,
                source = "mercadona",
                sourceProductId = "prod-1"
            ),
            CatalogItem(
                id = "item-2",
                name = "Pan",
                qty = 1.0,
                checked = false, // No checked
                updatedAt = "2026-02-25T10:00:00Z",
                thumbnail = null,
                price = 2.00,
                unitSize = null,
                unitFormat = null,
                unitPrice = null,
                isApproxSize = false,
                source = "mercadona",
                sourceProductId = "prod-2"
            ),
            CatalogItem(
                id = "item-3",
                name = "Queso",
                qty = 1.0,
                checked = true,
                updatedAt = "2026-02-25T10:00:00Z",
                thumbnail = null,
                price = 3.50,
                unitSize = null,
                unitFormat = null,
                unitPrice = null,
                isApproxSize = false,
                source = "mercadona",
                sourceProductId = "prod-3"
            )
        )
        val listDetail = ListDetail(
            id = "list-123",
            title = "Supermercado",
            items = items,
            updatedAt = "2026-02-25T10:00:00Z"
        )

        // Act
        val total = useCase(listDetail)

        // Assert
        // (1.50 * 2.0) + (3.50 * 1.0) = 3.0 + 3.5 = 6.5
        assertEquals(6.5, total, 0.01)
    }

    @Test
    fun `calculateForItems calculates total for specific items list`() {
        // Arrange
        val items = listOf(
            CatalogItem(
                id = "item-1",
                name = "Leche",
                qty = 1.0,
                checked = true,
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

        // Act
        val total = useCase.calculateForItems(items)

        // Assert
        assertEquals(1.50, total, 0.01)
    }

    @Test
    fun `invoke handles decimal quantities correctly`() {
        // Arrange
        val items = listOf(
            CatalogItem(
                id = "item-1",
                name = "Queso (kg)",
                qty = 0.5, // Media unidad
                checked = true,
                updatedAt = "2026-02-25T10:00:00Z",
                thumbnail = null,
                price = 10.0,
                unitSize = null,
                unitFormat = null,
                unitPrice = null,
                isApproxSize = false,
                source = "mercadona",
                sourceProductId = "prod-1"
            )
        )
        val listDetail = ListDetail(
            id = "list-123",
            title = "Supermercado",
            items = items,
            updatedAt = "2026-02-25T10:00:00Z"
        )

        // Act
        val total = useCase(listDetail)

        // Assert
        // 10.0 * 0.5 = 5.0
        assertEquals(5.0, total, 0.01)
    }
}

