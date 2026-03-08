package com.alentadev.shopping.feature.listdetail.data.local

import org.junit.Assert.assertEquals
import org.junit.Test

class CheckedStateMergePolicyTest {

    @Test
    fun `resolveCheckedState returns pending checked when pending operation exists`() {
        val resolvedChecked = resolveCheckedState(remoteChecked = false, pendingChecked = true)

        assertEquals(true, resolvedChecked)
    }

    @Test
    fun `resolveCheckedState returns remote checked when pending operation does not exist`() {
        val resolvedChecked = resolveCheckedState(remoteChecked = false, pendingChecked = null)

        assertEquals(false, resolvedChecked)
    }
}
