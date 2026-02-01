package com.alentadev.shopping.feature.lists.domain.usecase

import com.alentadev.shopping.feature.lists.domain.entity.ListStatus
import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class GetActiveListsUseCaseTest {
    private lateinit var listsRepository: ListsRepository
    private lateinit var getActiveListsUseCase: GetActiveListsUseCase

    @Before
    fun setup() {
        listsRepository = mockk()
        getActiveListsUseCase = GetActiveListsUseCase(listsRepository)
    }

    @Test
    fun `execute returns active lists sorted by updated at descending`() = runTest {
        // Arrange
        val lists = listOf(
            ShoppingList(
                id = "list-1",
                title = "Supermercado",
                status = ListStatus.ACTIVE,
                updatedAt = 1000L,
                itemCount = 5
            ),
            ShoppingList(
                id = "list-2",
                title = "Farmacia",
                status = ListStatus.ACTIVE,
                updatedAt = 2000L,
                itemCount = 3
            ),
            ShoppingList(
                id = "list-3",
                title = "Panadería",
                status = ListStatus.ACTIVE,
                updatedAt = 1500L,
                itemCount = 2
            )
        )

        coEvery { listsRepository.getActiveLists() } returns lists

        // Act
        val result = getActiveListsUseCase.execute()

        // Assert
        assertEquals(3, result.size)
        // Verificar que están ordenadas por updatedAt descendente
        assertEquals("list-2", result[0].id)  // 2000L
        assertEquals("list-3", result[1].id)  // 1500L
        assertEquals("list-1", result[2].id)  // 1000L
    }

    @Test
    fun `execute returns empty list when no active lists`() = runTest {
        // Arrange
        coEvery { listsRepository.getActiveLists() } returns emptyList()

        // Act
        val result = getActiveListsUseCase.execute()

        // Assert
        assertTrue(result.isEmpty())
    }

    @Test
    fun `execute throws error if repository returns non-active lists`() = runTest {
        // Arrange
        val listsWithNonActive = listOf(
            ShoppingList(
                id = "list-1",
                title = "Supermercado",
                status = ListStatus.COMPLETED,  // ← NO ACTIVA
                updatedAt = 1000L,
                itemCount = 5
            )
        )

        coEvery { listsRepository.getActiveLists() } returns listsWithNonActive

        // Act & Assert
        val exception = assertThrows(IllegalArgumentException::class.java) {
            runBlocking {
                getActiveListsUseCase.execute()
            }
        }
        assertTrue(exception.message?.contains("devolvió listas que no son activas") == true)
    }

    @Test
    fun `execute returns lists with correct properties`() = runTest {
        // Arrange
        val lists = listOf(
            ShoppingList(
                id = "list-123",
                title = "Compra semanal",
                status = ListStatus.ACTIVE,
                updatedAt = 1609459200000L,  // 2021-01-01
                itemCount = 10
            )
        )

        coEvery { listsRepository.getActiveLists() } returns lists

        // Act
        val result = getActiveListsUseCase.execute()

        // Assert
        assertEquals(1, result.size)
        val list = result[0]
        assertEquals("list-123", list.id)
        assertEquals("Compra semanal", list.title)
        assertEquals(ListStatus.ACTIVE, list.status)
        assertEquals(1609459200000L, list.updatedAt)
        assertEquals(10, list.itemCount)
    }
}

