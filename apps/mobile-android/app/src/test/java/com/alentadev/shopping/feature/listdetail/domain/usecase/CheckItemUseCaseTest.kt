package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class CheckItemUseCaseTest {
    private lateinit var repository: ListDetailRepository
    private lateinit var useCase: CheckItemUseCase

    @Before
    fun setup() {
        repository = mockk()
        useCase = CheckItemUseCase(repository)
    }

    @Test
    fun `invoke calls repository to update item checked to true`() = runTest {
        // Arrange
        val listId = "list-123"
        val itemId = "item-456"
        val checked = true

        coEvery { repository.updateItemChecked(listId, itemId, checked) } returns Unit

        // Act
        useCase(listId, itemId, checked)

        // Assert
        coVerify(exactly = 1) { repository.updateItemChecked(listId, itemId, checked) }
    }

    @Test
    fun `invoke calls repository to update item checked to false`() = runTest {
        // Arrange
        val listId = "list-123"
        val itemId = "item-456"
        val checked = false

        coEvery { repository.updateItemChecked(listId, itemId, checked) } returns Unit

        // Act
        useCase(listId, itemId, checked)

        // Assert
        coVerify(exactly = 1) { repository.updateItemChecked(listId, itemId, checked) }
    }

    @Test
    fun `invoke throws exception when list id is blank`() = runTest {
        // Arrange
        val listId = ""
        val itemId = "item-456"
        val checked = true

        // Act & Assert
        try {
            useCase(listId, itemId, checked)
            fail("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertEquals("El ID de la lista no puede estar vacío", e.message)
        }

        // Verify repository was not called
        coVerify(exactly = 0) { repository.updateItemChecked(any(), any(), any()) }
    }

    @Test
    fun `invoke throws exception when item id is blank`() = runTest {
        // Arrange
        val listId = "list-123"
        val itemId = ""
        val checked = true

        // Act & Assert
        try {
            useCase(listId, itemId, checked)
            fail("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertEquals("El ID del item no puede estar vacío", e.message)
        }

        // Verify repository was not called
        coVerify(exactly = 0) { repository.updateItemChecked(any(), any(), any()) }
    }

    @Test
    fun `invoke throws exception when list id is whitespace`() = runTest {
        // Arrange
        val listId = "   "
        val itemId = "item-456"
        val checked = true

        // Act & Assert
        try {
            useCase(listId, itemId, checked)
            fail("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertEquals("El ID de la lista no puede estar vacío", e.message)
        }
    }

    @Test
    fun `invoke throws exception when item id is whitespace`() = runTest {
        // Arrange
        val listId = "list-123"
        val itemId = "   "
        val checked = true

        // Act & Assert
        try {
            useCase(listId, itemId, checked)
            fail("Expected IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertEquals("El ID del item no puede estar vacío", e.message)
        }
    }

    @Test
    fun `invoke propagates repository exceptions`() = runTest {
        // Arrange
        val listId = "list-123"
        val itemId = "item-456"
        val checked = true
        val expectedException = RuntimeException("Database error")

        coEvery { repository.updateItemChecked(listId, itemId, checked) } throws expectedException

        // Act & Assert
        try {
            useCase(listId, itemId, checked)
            fail("Expected RuntimeException")
        } catch (e: RuntimeException) {
            assertEquals("Database error", e.message)
        }
    }
}

