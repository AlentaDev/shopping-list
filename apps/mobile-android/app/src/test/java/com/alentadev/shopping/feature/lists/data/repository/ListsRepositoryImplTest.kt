package com.alentadev.shopping.feature.lists.data.repository

import com.alentadev.shopping.feature.lists.domain.entity.ListStatus
import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.data.remote.ListsRemoteDataSource
import com.alentadev.shopping.feature.lists.data.local.ListsLocalDataSource
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class ListsRepositoryImplTest {
    private lateinit var remoteDataSource: ListsRemoteDataSource
    private lateinit var localDataSource: ListsLocalDataSource
    private lateinit var repository: ListsRepositoryImpl

    @Before
    fun setup() {
        remoteDataSource = mockk()
        localDataSource = mockk()
        repository = ListsRepositoryImpl(remoteDataSource, localDataSource)
    }

    @Test
    fun `getActiveLists fetches from remote and saves to local`() = runTest {
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
            )
        )

        coEvery { remoteDataSource.getActiveLists() } returns lists
        coEvery { localDataSource.saveLists(lists) } returns Unit

        // Act
        val result = repository.getActiveLists()

        // Assert
        assertEquals(2, result.size)
        coVerify { remoteDataSource.getActiveLists() }
        coVerify { localDataSource.saveLists(lists) }
    }

    @Test
    fun `getActiveLists throws error when remote fails`() = runTest {
        // Arrange
        val error = Exception("Network error")
        coEvery { remoteDataSource.getActiveLists() } throws error

        // Act & Assert
        try {
            repository.getActiveLists()
            fail("Expected exception to be thrown")
        } catch (exception: Exception) {
            assertEquals("Network error", exception.message)
        }
    }

    @Test
    fun `refreshActiveLists updates remote and local`() = runTest {
        // Arrange
        val lists = listOf(
            ShoppingList(
                id = "list-3",
                title = "Nueva lista",
                status = ListStatus.ACTIVE,
                updatedAt = 3000L,
                itemCount = 2
            )
        )

        coEvery { remoteDataSource.getActiveLists() } returns lists
        coEvery { localDataSource.saveLists(lists) } returns Unit

        // Act
        val result = repository.refreshActiveLists()

        // Assert
        assertEquals(1, result.size)
        assertEquals("Nueva lista", result[0].title)
        coVerify { remoteDataSource.getActiveLists() }
        coVerify { localDataSource.saveLists(lists) }
    }

    @Test
    fun `getListById returns from remote`() = runTest {
        // Arrange
        val list = ShoppingList(
            id = "list-123",
            title = "Mi lista",
            status = ListStatus.ACTIVE,
            updatedAt = 1500L,
            itemCount = 10
        )

        coEvery { remoteDataSource.getListDetail("list-123") } returns list

        // Act
        val result = repository.getListById("list-123")

        // Assert
        assertNotNull(result)
        assertEquals("Mi lista", result?.title)
    }

    @Test
    fun `getListById falls back to local on error`() = runTest {
        // Arrange
        val list = ShoppingList(
            id = "list-456",
            title = "Lista en caché",
            status = ListStatus.ACTIVE,
            updatedAt = 1500L,
            itemCount = 5
        )

        coEvery { remoteDataSource.getListDetail("list-456") } throws Exception("Network error")
        coEvery { localDataSource.getListById("list-456") } returns list

        // Act
        val result = repository.getListById("list-456")

        // Assert
        assertNotNull(result)
        assertEquals("Lista en caché", result?.title)
    }

    @Test
    fun `getListById returns null when not found`() = runTest {
        // Arrange
        coEvery { remoteDataSource.getListDetail("nonexistent") } throws Exception("Not found")
        coEvery { localDataSource.getListById("nonexistent") } returns null

        // Act
        val result = repository.getListById("nonexistent")

        // Assert
        assertNull(result)
    }
}

