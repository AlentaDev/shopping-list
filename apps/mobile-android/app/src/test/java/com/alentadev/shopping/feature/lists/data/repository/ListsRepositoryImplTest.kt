package com.alentadev.shopping.feature.lists.data.repository

import com.alentadev.shopping.core.data.network.DataSource
import com.alentadev.shopping.core.data.network.OfflineFirstExecutor
import com.alentadev.shopping.core.data.network.OfflineFirstResult
import com.alentadev.shopping.core.network.ConnectivityGate
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
    private lateinit var offlineFirstExecutor: OfflineFirstExecutor
    private lateinit var connectivityGate: ConnectivityGate
    private lateinit var repository: ListsRepositoryImpl

    @Before
    fun setup() {
        remoteDataSource = mockk()
        localDataSource = mockk()
        offlineFirstExecutor = mockk()
        connectivityGate = mockk()
        repository = ListsRepositoryImpl(remoteDataSource, localDataSource, offlineFirstExecutor, connectivityGate)
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
    fun `getCachedActiveLists returns local cache without remote call`() = runTest {
        val cached = listOf(
            ShoppingList(
                id = "list-cache",
                title = "Lista cache",
                status = ListStatus.ACTIVE,
                updatedAt = 1000L,
                itemCount = 2
            )
        )
        coEvery { localDataSource.getActiveListsOnce() } returns cached

        val result = repository.getCachedActiveLists()

        assertEquals(1, result.size)
        assertEquals("Lista cache", result.first().title)
        coVerify(exactly = 1) { localDataSource.getActiveListsOnce() }
        coVerify(exactly = 0) { remoteDataSource.getActiveLists() }
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

        coEvery {
            offlineFirstExecutor.execute<ShoppingList?>(
                connectivityGate = any(),
                fetchRemote = any(),
                saveRemote = any(),
                readLocal = any()
            )
        } returns OfflineFirstResult.Success(list, DataSource.REMOTE)

        // Act
        val result = repository.getListById("list-123")

        // Assert
        assertNotNull(result)
        assertEquals("Mi lista", result?.title)
        coVerify(exactly = 1) {
            offlineFirstExecutor.execute<ShoppingList?>(
                connectivityGate = any(),
                fetchRemote = any(),
                saveRemote = any(),
                readLocal = any()
            )
        }
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

        coEvery {
            offlineFirstExecutor.execute<ShoppingList?>(
                connectivityGate = any(),
                fetchRemote = any(),
                saveRemote = any(),
                readLocal = any()
            )
        } returns OfflineFirstResult.Success(list, DataSource.CACHE)

        // Act
        val result = repository.getListById("list-456")

        // Assert
        assertNotNull(result)
        assertEquals("Lista en caché", result?.title)
    }

    @Test
    fun `getListById returns null when not found`() = runTest {
        // Arrange
        coEvery {
            offlineFirstExecutor.execute<ShoppingList?>(
                connectivityGate = any(),
                fetchRemote = any(),
                saveRemote = any(),
                readLocal = any()
            )
        } returns OfflineFirstResult.Success(null, DataSource.CACHE)

        // Act
        val result = repository.getListById("nonexistent")

        // Assert
        assertNull(result)
    }

    @Test
    fun `getActiveListsWithSource marks remote data with fromCache false`() = runTest {
        val lists = listOf(
            ShoppingList("remote-1", "Remota", ListStatus.ACTIVE, 1111L, 2)
        )
        coEvery {
            offlineFirstExecutor.execute<List<ShoppingList>>(
                connectivityGate = any(),
                fetchRemote = any(),
                saveRemote = any(),
                readLocal = any()
            )
        } returns OfflineFirstResult.Success(lists, DataSource.REMOTE)

        val result = repository.getActiveListsWithSource()

        assertEquals(lists, result.lists)
        assertFalse(result.fromCache)
    }

    @Test
    fun `getActiveListsWithSource marks cached data with fromCache true`() = runTest {
        val cachedLists = listOf(
            ShoppingList("cache-1", "Cache", ListStatus.ACTIVE, 2222L, 3)
        )
        coEvery {
            offlineFirstExecutor.execute<List<ShoppingList>>(
                connectivityGate = any(),
                fetchRemote = any(),
                saveRemote = any(),
                readLocal = any()
            )
        } returns OfflineFirstResult.Success(cachedLists, DataSource.CACHE)

        val result = repository.getActiveListsWithSource()

        assertEquals(cachedLists, result.lists)
        assertTrue(result.fromCache)
    }

    @Test
    fun `getActiveListsWithSource throws when executor returns error`() = runTest {
        val error = IllegalStateException("cache unavailable")
        coEvery {
            offlineFirstExecutor.execute<List<ShoppingList>>(
                connectivityGate = any(),
                fetchRemote = any(),
                saveRemote = any(),
                readLocal = any()
            )
        } returns OfflineFirstResult.Error(error, DataSource.CACHE)

        try {
            repository.getActiveListsWithSource()
            fail("Expected exception to be thrown")
        } catch (exception: Throwable) {
            assertEquals("cache unavailable", exception.message)
        }
    }

    @Test
    fun `getActiveListsWithSource delegates connectivity decision to shared gate`() = runTest {
        val lists = listOf(ShoppingList("remote-2", "Remota 2", ListStatus.ACTIVE, 3333L, 1))
        coEvery {
            offlineFirstExecutor.execute<List<ShoppingList>>(
                connectivityGate = connectivityGate,
                fetchRemote = any(),
                saveRemote = any(),
                readLocal = any()
            )
        } returns OfflineFirstResult.Success(lists, DataSource.REMOTE)

        repository.getActiveListsWithSource()

        coVerify(exactly = 1) {
            offlineFirstExecutor.execute<List<ShoppingList>>(
                connectivityGate = connectivityGate,
                fetchRemote = any(),
                saveRemote = any(),
                readLocal = any()
            )
        }
    }

}
