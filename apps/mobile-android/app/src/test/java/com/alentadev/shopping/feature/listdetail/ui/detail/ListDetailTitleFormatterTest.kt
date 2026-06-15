package com.alentadev.shopping.feature.listdetail.ui.detail

import org.junit.Assert.assertEquals
import org.junit.Test

class ListDetailTitleFormatterTest {

    @Test
    fun `buildDetailTitle returns title with provider when available`() {
        assertEquals("Compra semanal · Mercadona", buildDetailTitle("Compra semanal", "Mercadona"))
    }

    @Test
    fun `buildDetailTitle returns only title when provider is blank`() {
        assertEquals("Compra semanal", buildDetailTitle("Compra semanal", ""))
    }
}
