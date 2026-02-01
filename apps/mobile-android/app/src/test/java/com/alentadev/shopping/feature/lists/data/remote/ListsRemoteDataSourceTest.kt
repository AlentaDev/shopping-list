package com.alentadev.shopping.feature.lists.data.remote

import com.alentadev.shopping.feature.lists.domain.entity.ListStatus
import com.alentadev.shopping.feature.lists.data.dto.ListSummaryDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class ListsRemoteDataSourceTest {
    private lateinit var listsApi: ListsApi
    private lateinit var remoteDataSource: ListsRemoteDataSource

    @Before
    fun setup() {
        listsApi = mockk()
        remoteDataSource = ListsRemoteDataSource(listsApi)
    }

    @Test
    fun `getActiveLists calls API and maps DTOs to domain`() = runTest {
        // Arrange
        val dtos = listOf(
            ListSummaryDto(
                id = "list-1",
                title = "Supermercado",
                status = "ACTIVE",
                updatedAt = 1000L,
                itemCount = 5
            ),
            ListSummaryDto(
                id = "list-2",
                title = "Farmacia",
                status = "ACTIVE",
                updatedAt = 2000L,
                itemCount = 3
            )
        )

        coEvery { listsApi.getActiveLists(status = "ACTIVE") } returns dtos

        // Act
        val result = remoteDataSource.getActiveLists()

        // Assert
        assertEquals(2, result.size)
        assertEquals("Supermercado", result[0].title)
        assertEquals(ListStatus.ACTIVE, result[0].status)
        assertEquals(5, result[0].itemCount)
    }

    @Test
    fun `getActiveLists handles empty list`() = runTest {
        // Arrange
        coEvery { listsApi.getActiveLists(status = "ACTIVE") } returns emptyList()

        // Act
        val result = remoteDataSource.getActiveLists()

        // Assert
        assertTrue(result.isEmpty())
    }

    @Test
    fun `getListDetail fetches and maps single list`() = runTest {
        // Arrange
        val dto = ListSummaryDto(
            id = "list-123",
            title = "Mi lista",
            status = "ACTIVE",
            updatedAt = 1500L,
            itemCount = 10
        )

        coEvery { listsApi.getListDetail("list-123") } returns dto

        // Act
        val result = remoteDataSource.getListDetail("list-123")

        // Assert
        assertEquals("list-123", result.id)
        assertEquals("Mi lista", result.title)
        assertEquals(10, result.itemCount)
    }

    @Test
    fun `getActiveLists maps status correctly`() = runTest {
        // Arrange
        val dtos = listOf(
            ListSummaryDto(id = "1", title = "L1", status = "ACTIVE", updatedAt = 1000L),
            ListSummaryDto(id = "2", title = "L2", status = "DRAFT", updatedAt = 1000L),
            ListSummaryDto(id = "3", title = "L3", status = "COMPLETED", updatedAt = 1000L)
        )

        coEvery { listsApi.getActiveLists(status = "ACTIVE") } returns dtos

        // Act
        val result = remoteDataSource.getActiveLists()

        // Assert
        assertEquals(ListStatus.ACTIVE, result[0].status)
        assertEquals(ListStatus.DRAFT, result[1].status)
        assertEquals(ListStatus.COMPLETED, result[2].status)
    }
}

