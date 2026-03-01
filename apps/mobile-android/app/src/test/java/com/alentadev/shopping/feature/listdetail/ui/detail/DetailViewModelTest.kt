package com.alentadev.shopping.feature.listdetail.ui.detail

import androidx.lifecycle.SavedStateHandle
import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import com.alentadev.shopping.feature.listdetail.domain.usecase.CalculateTotalUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.CheckItemUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.DetectRemoteChangesUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.GetListDetailUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.SyncCheckUseCase
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
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestWatcher
import org.junit.runner.Description

@OptIn(ExperimentalCoroutinesApi::class)
class DetailViewModelTest {
    private lateinit var getListDetailUseCase: GetListDetailUseCase
    private lateinit var checkItemUseCase: CheckItemUseCase
    private lateinit var calculateTotalUseCase: CalculateTotalUseCase
    private lateinit var syncCheckUseCase: SyncCheckUseCase
    private lateinit var detectRemoteChangesUseCase: DetectRemoteChangesUseCase
    private lateinit var networkMonitor: NetworkMonitor
    private lateinit var savedStateHandle: SavedStateHandle
    private lateinit var viewModel: DetailViewModel

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Before
    fun setup() {
        getListDetailUseCase = mockk()
        checkItemUseCase = mockk()
        calculateTotalUseCase = mockk()
        syncCheckUseCase = mockk()
        detectRemoteChangesUseCase = mockk()
        networkMonitor = mockk()
        savedStateHandle = SavedStateHandle(mapOf("listId" to "list-123"))

        // Mock calculateTotalUseCase para devolver un total por defecto
        every { calculateTotalUseCase(any()) } returns 15.50

        // Mock NetworkMonitor para simular conectado
        every { networkMonitor.isConnected } returns flowOf(true)
    }

    @Test
    fun `init loads list detail successfully`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val listDetail = createListDetail("list-123", "Test List", 3)
        every { getListDetailUseCase("list-123") } returns flowOf(listDetail)

        // Act
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        // Assert
        val state = viewModel.uiState.value
        assertTrue(state is ListDetailUiState.Success)
        assertEquals("Test List", (state as ListDetailUiState.Success).listDetail.title)
        assertEquals(15.50, state.total, 0.001)
    }

    @Test
    fun `init sets Error when use case throws`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val errorFlow = kotlinx.coroutines.flow.flow<ListDetail> {
            throw Exception("Network error")
        }
        every { getListDetailUseCase("list-123") } returns errorFlow

        // Act
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        // Assert
        val state = viewModel.uiState.value
        assertTrue(state is ListDetailUiState.Error)
        assertEquals("Network error", (state as ListDetailUiState.Error).message)
    }

    @Test
    fun `loadListDetail refreshes state successfully`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val listDetail = createListDetail("list-123", "Updated List", 2)
        every { getListDetailUseCase("list-123") } returns flowOf(listDetail)
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        // Act
        viewModel.loadListDetail()
        advanceUntilIdle()

        // Assert
        val state = viewModel.uiState.value
        assertTrue(state is ListDetailUiState.Success)
        assertEquals("Updated List", (state as ListDetailUiState.Success).listDetail.title)
    }

    @Test
    fun `toggleItemCheck calls checkItemUseCase with correct parameters`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val listDetail = createListDetail("list-123", "Test List", 2)
        every { getListDetailUseCase("list-123") } returns flowOf(listDetail)
        coEvery { checkItemUseCase("list-123", "item-1", true) } returns Unit
        coEvery { syncCheckUseCase("list-123", "item-1", true) } returns true
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        // Act
        viewModel.toggleItemCheck("item-1", true)
        advanceUntilIdle()

        // Assert
        coVerify(exactly = 1) { checkItemUseCase("list-123", "item-1", true) }
    }

    @Test
    fun `toggleItemCheck handles error gracefully`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val listDetail = createListDetail("list-123", "Test List", 2)
        every { getListDetailUseCase("list-123") } returns flowOf(listDetail)
        coEvery { checkItemUseCase("list-123", "item-1", true) } throws Exception("Update failed")
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        // Act
        viewModel.toggleItemCheck("item-1", true)
        advanceUntilIdle()

        // Assert - El estado no debe cambiar a Error
        val state = viewModel.uiState.value
        assertTrue(state is ListDetailUiState.Success)
    }

    @Test
    fun `missing listId throws exception`() {
        // Arrange
        val emptyStateHandle = SavedStateHandle(emptyMap<String, Any>())

        // Act & Assert
        try {
            viewModel = DetailViewModel(
                getListDetailUseCase = getListDetailUseCase,
                checkItemUseCase = checkItemUseCase,
                calculateTotalUseCase = calculateTotalUseCase,
                syncCheckUseCase = syncCheckUseCase,
                detectRemoteChangesUseCase = detectRemoteChangesUseCase,
                networkMonitor = networkMonitor,
                savedStateHandle = emptyStateHandle
            )
            fail("Expected IllegalStateException")
        } catch (e: IllegalStateException) {
            assertTrue(e.message?.contains("requerido") == true)
        }
    }

    @Test
    fun `state updates when Flow emits new ListDetail`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val listDetail1 = createListDetail("list-123", "Original", 2)
        val listDetail2 = createListDetail("list-123", "Updated", 3)

        val flow = kotlinx.coroutines.flow.flow {
            emit(listDetail1)
            kotlinx.coroutines.delay(100)
            emit(listDetail2)
        }

        every { getListDetailUseCase("list-123") } returns flow
        every { calculateTotalUseCase(listDetail1) } returns 10.0
        every { calculateTotalUseCase(listDetail2) } returns 20.0

        // Act
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        // Assert - Debería tener el último valor
        val state = viewModel.uiState.value
        assertTrue(state is ListDetailUiState.Success)
        assertEquals("Updated", (state as ListDetailUiState.Success).listDetail.title)
        assertEquals(20.0, state.total, 0.001)
    }

    // Helper para crear ListDetail de prueba
    private fun createListDetail(id: String, title: String, itemCount: Int): ListDetail {
        val items = (1..itemCount).map { index ->
            CatalogItem(
                id = "item-$index",
                name = "Item $index",
                qty = 1.0,
                checked = false,
                updatedAt = "2024-01-01",
                price = 5.0,
                sourceProductId = "prod-$index"
            )
        }
        return ListDetail(
            id = id,
            title = title,
            items = items,
            updatedAt = "2024-01-01"
        )
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


