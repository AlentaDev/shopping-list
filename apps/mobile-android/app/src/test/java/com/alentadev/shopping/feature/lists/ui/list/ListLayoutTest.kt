package com.alentadev.shopping.feature.lists.ui.list

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Test

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
}
