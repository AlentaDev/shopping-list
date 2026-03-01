package com.alentadev.shopping.feature.lists.ui.list

import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.feature.lists.domain.entity.ActiveListsResult
import com.alentadev.shopping.feature.lists.domain.entity.ListStatus
import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import com.alentadev.shopping.feature.lists.domain.usecase.GetActiveListsUseCase
import com.alentadev.shopping.feature.lists.domain.usecase.RefreshListsUseCase
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestWatcher
import org.junit.runner.Description

@OptIn(ExperimentalCoroutinesApi::class)
class ListsViewModelTest {
    private lateinit var getActiveListsUseCase: GetActiveListsUseCase
    private lateinit var refreshListsUseCase: RefreshListsUseCase
    private lateinit var listsRepository: ListsRepository
    private lateinit var networkMonitor: NetworkMonitor
    private lateinit var viewModel: ListsViewModel

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Before
    fun setup() {
        getActiveListsUseCase = mockk()
        refreshListsUseCase = mockk()
        listsRepository = mockk()
        networkMonitor = mockk()

        every { networkMonitor.isConnected } returns flowOf(true)

        viewModel = ListsViewModel(
            getActiveListsUseCase,
            refreshListsUseCase,
            listsRepository,
            networkMonitor
        )
    }

    @Test
    fun `loadLists sets Success when lists are returned`() = runTest(mainDispatcherRule.testDispatcher) {
        val lists = listOf(
            ShoppingList("1", "Lista 1", ListStatus.ACTIVE, 1000L, 3),
            ShoppingList("2", "Lista 2", ListStatus.ACTIVE, 2000L, 2)
        )
        val result = ActiveListsResult(lists, fromCache = false)
        coEvery { listsRepository.getActiveListsWithSource() } returns result

        viewModel.loadLists()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is ListsUiState.Success)
        assertEquals(2, (state as ListsUiState.Success).lists.size)
        assertFalse(state.fromCache)
    }

    @Test
    fun `loadLists sets Empty online when no lists are returned`() = runTest(mainDispatcherRule.testDispatcher) {
        val result = ActiveListsResult(emptyList(), fromCache = false)
        coEvery { listsRepository.getActiveListsWithSource() } returns result

        viewModel.loadLists()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is ListsUiState.Empty)
        assertFalse((state as ListsUiState.Empty).isOffline)
    }

    @Test
    fun `loadLists offline uses cache and avoids remote call`() = runTest(mainDispatcherRule.testDispatcher) {
        every { networkMonitor.isConnected } returns flowOf(false)
        val cached = listOf(
            ShoppingList("1", "Lista cache", ListStatus.ACTIVE, 1000L, 1)
        )
        coEvery { listsRepository.getCachedActiveLists() } returns cached

        viewModel = ListsViewModel(
            getActiveListsUseCase,
            refreshListsUseCase,
            listsRepository,
            networkMonitor
        )

        viewModel.loadLists()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is ListsUiState.Success)
        assertTrue((state as ListsUiState.Success).fromCache)
        coVerify(exactly = 1) { listsRepository.getCachedActiveLists() }
        coVerify(exactly = 0) { listsRepository.getActiveListsWithSource() }
    }

    @Test
    fun `loadLists offline sets Empty with retry state when cache is empty`() = runTest(mainDispatcherRule.testDispatcher) {
        every { networkMonitor.isConnected } returns flowOf(false)
        coEvery { listsRepository.getCachedActiveLists() } returns emptyList()

        viewModel = ListsViewModel(
            getActiveListsUseCase,
            refreshListsUseCase,
            listsRepository,
            networkMonitor
        )

        viewModel.loadLists()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is ListsUiState.Empty)
        assertTrue((state as ListsUiState.Empty).isOffline)
        coVerify(exactly = 1) { listsRepository.getCachedActiveLists() }
        coVerify(exactly = 0) { listsRepository.getActiveListsWithSource() }
    }

    @Test
    fun `loadLists sets Error when use case throws`() = runTest(mainDispatcherRule.testDispatcher) {
        coEvery { listsRepository.getActiveListsWithSource() } throws Exception("Network error")

        viewModel.loadLists()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is ListsUiState.Error)
        assertEquals("Network error", (state as ListsUiState.Error).message)
    }

    @Test
    fun `refreshLists sets Success when lists are returned`() = runTest(mainDispatcherRule.testDispatcher) {
        val lists = listOf(
            ShoppingList("1", "Lista 1", ListStatus.ACTIVE, 1000L, 3)
        )
        coEvery { refreshListsUseCase.execute() } returns lists

        viewModel.refreshLists()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is ListsUiState.Success)
        assertEquals(1, (state as ListsUiState.Success).lists.size)
        assertFalse(state.fromCache)
    }

    @Test
    fun `refreshLists sets Error when use case throws`() = runTest(mainDispatcherRule.testDispatcher) {
        coEvery { refreshListsUseCase.execute() } throws Exception("Refresh error")

        viewModel.refreshLists()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is ListsUiState.Error)
        assertEquals("Refresh error", (state as ListsUiState.Error).message)
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class MainDispatcherRule(
    val testDispatcher: TestDispatcher = StandardTestDispatcher()
) : TestWatcher() {
    override fun starting(description: Description) {
        Dispatchers.setMain(testDispatcher)
    }

    override fun finished(description: Description) {
        Dispatchers.resetMain()
    }
}
