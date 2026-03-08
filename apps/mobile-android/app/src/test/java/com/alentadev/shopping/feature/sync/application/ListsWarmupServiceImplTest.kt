package com.alentadev.shopping.feature.sync.application

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import com.alentadev.shopping.feature.lists.domain.entity.ListStatus
import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import com.alentadev.shopping.feature.sync.domain.DefaultRefreshDecisionPolicy
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test

class ListsWarmupServiceImplTest {
    private lateinit var listsRepository: ListsRepository
    private lateinit var listDetailRepository: ListDetailRepository
    private lateinit var service: ListsWarmupService

    @Before
    fun setup() {
        listsRepository = mockk()
        listDetailRepository = mockk()
        service = ListsWarmupServiceImpl(
            listsRepository = listsRepository,
            listDetailRepository = listDetailRepository,
            refreshDecisionPolicy = DefaultRefreshDecisionPolicy()
        )
    }

    @Test
    fun `warmUp hydrates when detail is missing`() = runTest {
        val list = ShoppingList("l1", "Lista 1", ListStatus.ACTIVE, 100L, 2)
        coEvery { listsRepository.refreshActiveLists() } returns listOf(list)
        coEvery { listDetailRepository.hasCachedListDetail("l1") } returns false
        coEvery { listDetailRepository.getCachedSnapshotTimestamp("l1") } returns null
        coEvery { listDetailRepository.refreshListDetail("l1") } returns Unit

        service.warmUp()

        coVerify(exactly = 1) { listDetailRepository.refreshListDetail("l1") }
    }

    @Test
    fun `warmUp skips when remote and local timestamps are equal`() = runTest {
        val list = ShoppingList("l1", "Lista 1", ListStatus.ACTIVE, 100L, 2)
        coEvery { listsRepository.refreshActiveLists() } returns listOf(list)
        coEvery { listDetailRepository.hasCachedListDetail("l1") } returns true
        coEvery { listDetailRepository.getCachedSnapshotTimestamp("l1") } returns 100L

        service.warmUp()

        coVerify(exactly = 0) { listDetailRepository.refreshListDetail(any()) }
    }
}
