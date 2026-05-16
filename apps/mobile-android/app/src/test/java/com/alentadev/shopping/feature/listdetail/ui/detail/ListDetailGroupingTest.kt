package com.alentadev.shopping.feature.listdetail.ui.detail

import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ManualItem
import org.junit.Assert.assertEquals
import org.junit.Test

class ListDetailGroupingTest {

    @Test
    fun `groups items by category level 1 and ignores subcategory as grouping axis`() {
        val items = listOf(
            CatalogItem(
                id = "1",
                name = "Leche",
                qty = 1.0,
                checked = false,
                updatedAt = "2026-01-01T00:00:00Z",
                sourceProductId = "prod-1",
                categorySnapshot = "Lácteos",
                subcategorySnapshot = "Leches"
            ),
            CatalogItem(
                id = "2",
                name = "Queso",
                qty = 1.0,
                checked = false,
                updatedAt = "2026-01-01T00:00:00Z",
                sourceProductId = "prod-2",
                categorySnapshot = "Lácteos",
                subcategorySnapshot = "Quesos"
            )
        )

        val grouped = groupItemsByCategoryLevel1(items)

        assertEquals(1, grouped.size)
        assertEquals("Lácteos", grouped.first().category)
        assertEquals(listOf("Leche", "Queso"), grouped.first().items.map { it.name })
    }

    @Test
    fun `uses Sin categoría as defensive fallback for missing category snapshot`() {
        val items = listOf(
            CatalogItem(
                id = "1",
                name = "Producto legacy",
                qty = 1.0,
                checked = false,
                updatedAt = "2026-01-01T00:00:00Z",
                sourceProductId = "prod-1",
                categorySnapshot = null,
                subcategorySnapshot = "Legacy"
            ),
            ManualItem(
                id = "2",
                name = "Pan suelto",
                qty = 1.0,
                checked = false,
                updatedAt = "2026-01-01T00:00:00Z"
            )
        )

        val grouped = groupItemsByCategoryLevel1(items)

        assertEquals(1, grouped.size)
        assertEquals("Sin categoría", grouped.first().category)
        assertEquals(listOf("Producto legacy", "Pan suelto"), grouped.first().items.map { it.name })
    }
}
