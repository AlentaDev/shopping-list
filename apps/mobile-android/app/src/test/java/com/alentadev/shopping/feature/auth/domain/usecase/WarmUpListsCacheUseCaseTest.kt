package com.alentadev.shopping.feature.auth.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import com.alentadev.shopping.feature.lists.domain.entity.ListStatus
import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test

class WarmUpListsCacheUseCaseTest {
    private lateinit var listsRepository: ListsRepository
    private lateinit var listDetailRepository: ListDetailRepository
    private lateinit var useCase: WarmUpListsCacheUseCase

    @Before
    fun setup() {
        listsRepository = mockk()
        listDetailRepository = mockk()
        useCase = WarmUpListsCacheUseCase(listsRepository, listDetailRepository)
    }

    @Test
    fun `execute skips detail hydration when there are no active lists`() = runTest {
        coEvery { listsRepository.refreshActiveLists() } returns emptyList()

        useCase.execute()

        coVerify(exactly = 1) { listsRepository.refreshActiveLists() }
        coVerify(exactly = 0) { listDetailRepository.hasCachedListDetail(any()) }
        coVerify(exactly = 0) { listDetailRepository.refreshListDetail(any()) }
    }

    @Test
    fun `execute hydrates only missing cached details`() = runTest {
        val listA = ShoppingList("list-a", "Lista A", ListStatus.ACTIVE, 1000L, 2)
        val listB = ShoppingList("list-b", "Lista B", ListStatus.ACTIVE, 2000L, 3)
        coEvery { listsRepository.refreshActiveLists() } returns listOf(listA, listB)
        coEvery { listDetailRepository.hasCachedListDetail("list-a") } returns true
        coEvery { listDetailRepository.hasCachedListDetail("list-b") } returns false
        coEvery { listDetailRepository.refreshListDetail("list-b") } returns Unit

        useCase.execute()

        coVerify(exactly = 1) { listDetailRepository.hasCachedListDetail("list-a") }
        coVerify(exactly = 1) { listDetailRepository.hasCachedListDetail("list-b") }
        coVerify(exactly = 0) { listDetailRepository.refreshListDetail("list-a") }
        coVerify(exactly = 1) { listDetailRepository.refreshListDetail("list-b") }
    }
}
