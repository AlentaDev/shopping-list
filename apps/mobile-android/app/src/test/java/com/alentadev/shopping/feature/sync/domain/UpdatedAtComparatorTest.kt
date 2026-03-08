package com.alentadev.shopping.feature.sync.domain

import org.junit.Assert.assertFalse
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class UpdatedAtComparatorTest {
    private val comparator = UpdatedAtComparator()

    @Test
    fun `isRemoteStrictlyNewer returns true when remote date is newer`() {
        assertTrue(comparator.isRemoteStrictlyNewer("2025-01-01T10:01:00Z", "2025-01-01T10:00:00Z"))
    }

    @Test
    fun `isRemoteStrictlyNewer returns false when timestamps are invalid`() {
        assertFalse(comparator.isRemoteStrictlyNewer("bad", "2025-01-01T10:00:00Z"))
        assertFalse(comparator.isRemoteStrictlyNewer("2025-01-01T10:00:00Z", "bad"))
    }

    @Test
    fun `compare returns PARSE_FAILURE when any timestamp is invalid`() {
        assertEquals(
            UpdatedAtComparison.PARSE_FAILURE,
            comparator.compare("bad", "2025-01-01T10:00:00Z")
        )
    }
}
