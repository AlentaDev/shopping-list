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

class RefreshListsUseCaseTest {
    private lateinit var listsRepository: ListsRepository
    private lateinit var refreshListsUseCase: RefreshListsUseCase

    @Before
    fun setup() {
        listsRepository = mockk()
        refreshListsUseCase = RefreshListsUseCase(listsRepository)
    }

    @Test
    fun `execute calls repository refresh method`() = runTest {
        // Arrange
        val lists = listOf(
            ShoppingList(
                id = "list-1",
                title = "Supermercado",
                status = ListStatus.ACTIVE,
                updatedAt = 1000L,
                itemCount = 5
            )
        )

        coEvery { listsRepository.refreshActiveLists() } returns lists

        // Act
        val result = refreshListsUseCase.execute()

        // Assert
        assertEquals(lists, result)
        assertEquals(1, result.size)
    }

    @Test
    fun `execute returns updated lists from server`() = runTest {
        // Arrange
        val updatedLists = listOf(
            ShoppingList(
                id = "list-2",
                title = "Nueva lista",
                status = ListStatus.ACTIVE,
                updatedAt = 2000L,
                itemCount = 8
            ),
            ShoppingList(
                id = "list-3",
                title = "Otra lista",
                status = ListStatus.ACTIVE,
                updatedAt = 1500L,
                itemCount = 3
            )
        )

        coEvery { listsRepository.refreshActiveLists() } returns updatedLists

        // Act
        val result = refreshListsUseCase.execute()

        // Assert
        assertEquals(2, result.size)
        assertEquals("list-2", result[0].id)
        assertEquals("list-3", result[1].id)
    }

    @Test
    fun `execute returns empty list when no active lists on server`() = runTest {
        // Arrange
        coEvery { listsRepository.refreshActiveLists() } returns emptyList()

        // Act
        val result = refreshListsUseCase.execute()

        // Assert
        assertTrue(result.isEmpty())
    }

    @Test
    fun `execute throws exception on network error`() = runTest {
        // Arrange
        val networkException = Exception("Connection timeout")
        coEvery { listsRepository.refreshActiveLists() } throws networkException

        // Act & Assert
        val exception = assertThrows(Exception::class.java) {
            runBlocking {
                refreshListsUseCase.execute()
            }
        }
        assertEquals("Connection timeout", exception.message)
    }
}

