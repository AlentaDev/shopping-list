package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

class CompleteListUseCaseTest {
    private lateinit var repository: ListDetailRepository
    private lateinit var useCase: CompleteListUseCase

    @Before
    fun setup() {
        repository = mockk()
        useCase = CompleteListUseCase(repository)
    }

    @Test
    fun `allows completion with unchecked items`() = runTest {
        val listId = "list-123"
        val checkedItemIds = listOf("item-1")

        coEvery { repository.completeList(listId, checkedItemIds) } returns CompleteListResult.Success

        val result = useCase(listId, checkedItemIds)

        assertEquals(CompleteListResult.Success, result)
        coVerify(exactly = 1) { repository.completeList(listId, checkedItemIds) }
    }

    @Test
    fun `handles repository success`() = runTest {
        val listId = "list-456"
        val checkedItemIds = emptyList<String>()

        coEvery { repository.completeList(listId, checkedItemIds) } returns CompleteListResult.Success

        val result = useCase(listId, checkedItemIds)

        assertEquals(CompleteListResult.Success, result)
    }

    @Test
    fun `handles typed failure results offline invalid transition and others`() = runTest {
        val listId = "list-789"
        val checkedItemIds = listOf("item-10", "item-11")

        val failures = listOf(
            CompleteListResult.Offline,
            CompleteListResult.InvalidTransition,
            CompleteListResult.Unauthorized,
            CompleteListResult.Forbidden,
            CompleteListResult.NotFound,
            CompleteListResult.ServerError
        )

        failures.forEach { failure ->
            coEvery { repository.completeList(listId, checkedItemIds) } returns failure

            val result = useCase(listId, checkedItemIds)

            assertEquals(failure, result)
        }

        coVerify(exactly = failures.size) { repository.completeList(listId, checkedItemIds) }
    }
}
