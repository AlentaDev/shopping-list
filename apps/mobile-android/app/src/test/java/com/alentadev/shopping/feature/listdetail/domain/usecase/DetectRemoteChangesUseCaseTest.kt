package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class DetectRemoteChangesUseCaseTest {

    private lateinit var repository: ListDetailRepository
    private lateinit var useCase: DetectRemoteChangesUseCase

    @Before
    fun setup() {
        repository = mockk()
        useCase = DetectRemoteChangesUseCase(repository)
    }

    @Test
    fun `invoke returns true when remote updatedAt is newer than local`() = runTest {
        coEvery { repository.getCachedListUpdatedAt("list-1") } returns "2025-01-01T10:00:00Z"
        coEvery { repository.getRemoteListUpdatedAt("list-1") } returns "2025-01-01T10:01:00Z"

        val result = useCase("list-1")

        assertTrue(result)
    }

    @Test
    fun `invoke returns false when timestamps are equal`() = runTest {
        coEvery { repository.getCachedListUpdatedAt("list-1") } returns "2025-01-01T10:00:00Z"
        coEvery { repository.getRemoteListUpdatedAt("list-1") } returns "2025-01-01T10:00:00Z"

        val result = useCase("list-1")

        assertFalse(result)
    }

    @Test
    fun `invoke returns false when local updatedAt is missing`() = runTest {
        coEvery { repository.getCachedListUpdatedAt("list-1") } returns null

        val result = useCase("list-1")

        assertFalse(result)
        coVerify(exactly = 0) { repository.getRemoteListUpdatedAt(any()) }
    }


    @Test
    fun `invoke validates list id`() = runTest {
        try {
            useCase("   ")
            kotlin.test.fail("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertEquals("El ID de la lista no puede estar vacío", e.message)
        }
    }
}
