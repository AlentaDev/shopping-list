package com.alentadev.shopping.feature.lists.ui.list

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.ZoneOffset
import java.time.ZonedDateTime

class ListLayoutTest {

    @Test
    fun `buildListContentPadding keeps scaffold top padding and adds screen spacing`() {
        val scaffoldPadding = PaddingValues(top = 64.dp, bottom = 10.dp)

        val result = buildListContentPadding(scaffoldPadding)

        assertEquals(80.dp, result.calculateTopPadding())
        assertEquals(26.dp, result.calculateBottomPadding())
        assertEquals(16.dp, result.calculateLeftPadding(androidx.compose.ui.unit.LayoutDirection.Ltr))
        assertEquals(16.dp, result.calculateRightPadding(androidx.compose.ui.unit.LayoutDirection.Ltr))
    }

    @Test
    fun `formatListUpdatedAt returns readable spanish date`() {
        val epochMillis = ZonedDateTime.of(2026, 5, 16, 14, 30, 0, 0, ZoneOffset.UTC)
            .toInstant()
            .toEpochMilli()

        val formatted = formatListUpdatedAt(epochMillis)

        assertEquals("16/05/2026 16:30", formatted)
    }

    @Test
    fun `formatListUpdatedAt returns placeholder for invalid epoch`() {
        assertEquals("—", formatListUpdatedAt(0L))
    }

    @Test
    fun `buildListTitle returns title with provider when available`() {
        assertEquals("Compra semanal · Mercadona", buildListTitle("Compra semanal", "Mercadona"))
    }

    @Test
    fun `buildListTitle returns only title when provider is blank`() {
        assertEquals("Compra semanal", buildListTitle("Compra semanal", "  "))
    }
}
