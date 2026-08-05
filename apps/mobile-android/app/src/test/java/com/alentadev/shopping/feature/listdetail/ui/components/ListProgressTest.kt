package com.alentadev.shopping.feature.listdetail.ui.components

import com.alentadev.shopping.feature.listdetail.domain.entity.ManualItem
import org.junit.Assert.assertEquals
import org.junit.Test

class ListProgressTest {

    @Test
    fun `calculates completed items and fraction`() {
        val progress = calculateListProgress(
            listOf(
                ManualItem("1", "Leche", 1.0, true, "2026-01-01T00:00:00Z"),
                ManualItem("2", "Pan", 1.0, false, "2026-01-01T00:00:00Z"),
                ManualItem("3", "Huevos", 1.0, true, "2026-01-01T00:00:00Z")
            )
        )

        assertEquals(2, progress.completed)
        assertEquals(3, progress.total)
        assertEquals(2f / 3f, progress.fraction, 0.001f)
    }

    @Test
    fun `uses full progress when every item is completed`() {
        val progress = calculateListProgress(
            listOf(
                ManualItem("1", "Leche", 1.0, true, "2026-01-01T00:00:00Z"),
                ManualItem("2", "Pan", 1.0, true, "2026-01-01T00:00:00Z")
            )
        )

        assertEquals(2, progress.completed)
        assertEquals(2, progress.total)
        assertEquals(1f, progress.fraction, 0f)
    }

    @Test
    fun `uses zero progress for empty lists`() {
        val progress = calculateListProgress(emptyList())

        assertEquals(0, progress.completed)
        assertEquals(0, progress.total)
        assertEquals(0f, progress.fraction, 0f)
    }
}
