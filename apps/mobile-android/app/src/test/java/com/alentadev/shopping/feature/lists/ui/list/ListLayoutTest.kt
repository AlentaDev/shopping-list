package com.alentadev.shopping.feature.lists.ui.list

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.unit.dp
import com.alentadev.shopping.R
import com.alentadev.shopping.ui.components.accountInitials
import com.alentadev.shopping.ui.components.providerLogoResource
import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.ZoneOffset
import java.time.ZonedDateTime

class ListLayoutTest {

    @Test
    fun `buildListContentPadding leaves a larger gap below the title`() {
        val scaffoldPadding = PaddingValues(top = 64.dp, bottom = 10.dp)

        val result = buildListContentPadding(scaffoldPadding)

        assertEquals(20.dp, result.calculateTopPadding())
        assertEquals(26.dp, result.calculateBottomPadding())
        assertEquals(16.dp, result.calculateLeftPadding(androidx.compose.ui.unit.LayoutDirection.Ltr))
        assertEquals(16.dp, result.calculateRightPadding(androidx.compose.ui.unit.LayoutDirection.Ltr))
    }

    @Test
    fun `formatListPreparedAt returns localized spanish long date`() {
        val epochMillis = ZonedDateTime.of(2026, 8, 4, 14, 30, 0, 0, ZoneOffset.UTC)
            .toInstant()
            .toEpochMilli()

        val formatted = formatListPreparedAt(epochMillis)

        assertEquals("4 agosto, 2026", formatted)
    }

    @Test
    fun `formatListPreparedAt returns placeholder for invalid epoch`() {
        assertEquals("—", formatListPreparedAt(0L))
    }

    @Test
    fun `account initials always uses two letters when available`() {
        assertEquals("JU", accountInitials("Juan Ugalde Smith"))
        assertEquals("JU", accountInitials("Juan"))
        assertEquals("AN", accountInitials("Ana"))
        assertEquals(null, accountInitials(null))
    }

    @Test
    fun `provider logo resources match supported provider names`() {
        assertEquals(R.drawable.provider_mercadona_logo, providerLogoResource("Mercadona"))
        assertEquals(R.drawable.provider_bonpreuesclat_logo, providerLogoResource("Bonpreu Esclat"))
        assertEquals(null, providerLogoResource("Proveedor local"))
    }
}
