package com.alentadev.shopping.feature.listdetail.ui.detail

import androidx.lifecycle.SavedStateHandle
import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import com.alentadev.shopping.feature.listdetail.domain.usecase.CalculateTotalUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.CheckItemUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.CompleteListResult
import com.alentadev.shopping.feature.listdetail.domain.usecase.CompleteListUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.DetectRemoteChangesUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.GetListDetailUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.RefreshDetailDecision
import com.alentadev.shopping.feature.listdetail.domain.usecase.RefreshListDetailIfNeededUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.SyncCheckResult
import com.alentadev.shopping.feature.listdetail.domain.usecase.SyncCheckUseCase
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
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
    private lateinit var completeListUseCase: CompleteListUseCase
    private lateinit var syncCheckUseCase: SyncCheckUseCase
    private lateinit var detectRemoteChangesUseCase: DetectRemoteChangesUseCase
    private lateinit var refreshListDetailIfNeededUseCase: RefreshListDetailIfNeededUseCase
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
        completeListUseCase = mockk()
        syncCheckUseCase = mockk()
        detectRemoteChangesUseCase = mockk()
        refreshListDetailIfNeededUseCase = mockk()
        networkMonitor = mockk()
        savedStateHandle = SavedStateHandle(mapOf("listId" to "list-123"))

        // Mock calculateTotalUseCase para devolver un total por defecto
        every { calculateTotalUseCase(any()) } returns 15.50

        // Mock NetworkMonitor para simular conectado
        every { networkMonitor.isConnected } returns flowOf(true)
        every { networkMonitor.isCurrentlyConnected() } returns true
        coEvery { refreshListDetailIfNeededUseCase(any()) } returns RefreshDetailDecision.SKIP_EQUAL
        coEvery { completeListUseCase(any(), any()) } returns CompleteListResult.Success
    }

    @Test
    fun `init loads list detail successfully`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val listDetail = createListDetail("list-123", "Test List", 3)
        every { getListDetailUseCase("list-123", any()) } returns flowOf(listDetail)

        // Act
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
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
    fun `init offline loads cached detail and marks fromCache`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val listDetail = createListDetail("list-123", "Offline List", 2)
        every { networkMonitor.isConnected } returns flowOf(false)
        every { networkMonitor.isCurrentlyConnected() } returns false
        every { getListDetailUseCase("list-123", true) } returns flowOf(listDetail)

        // Act
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        // Assert
        val state = viewModel.uiState.value
        assertTrue(state is ListDetailUiState.Success)
        assertTrue((state as ListDetailUiState.Success).fromCache)
        io.mockk.verify(exactly = 1) { getListDetailUseCase("list-123", true) }
        io.mockk.verify(exactly = 0) { getListDetailUseCase("list-123", false) }
    }




    @Test
    fun `init keeps Room as source when flow is stale and current connectivity is online`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val listDetail = createListDetail("list-123", "Recovered Network", 2)
        every { networkMonitor.isConnected } returns flowOf(false)
        every { networkMonitor.isCurrentlyConnected() } returns true
        coEvery { refreshListDetailIfNeededUseCase(any()) } returns RefreshDetailDecision.SKIP_EQUAL
        every { getListDetailUseCase("list-123", true) } returns flowOf(listDetail)

        // Act
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        // Assert
        val state = viewModel.uiState.value
        assertTrue(state is ListDetailUiState.Success)
        assertTrue((state as ListDetailUiState.Success).fromCache)
        verify(exactly = 1) { networkMonitor.isCurrentlyConnected() }
        verify(exactly = 1) { getListDetailUseCase("list-123", true) }
        verify(exactly = 0) { getListDetailUseCase("list-123", false) }
    }

    @Test
    fun `init uses current offline connectivity when reactive state starts optimistic`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val listDetail = createListDetail("list-123", "Offline From Current", 2)
        every { networkMonitor.isConnected } returns flowOf(false)
        every { networkMonitor.isCurrentlyConnected() } returns false
        every { getListDetailUseCase("list-123", true) } returns flowOf(listDetail)

        // Act
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        // Assert
        val state = viewModel.uiState.value
        assertTrue(state is ListDetailUiState.Success)
        assertTrue((state as ListDetailUiState.Success).fromCache)
        verify(exactly = 1) { getListDetailUseCase("list-123", true) }
        verify(exactly = 0) { getListDetailUseCase("list-123", false) }
    }

    @Test
    fun `init sets Error when use case throws`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val errorFlow = kotlinx.coroutines.flow.flow<ListDetail> {
            throw Exception("Network error")
        }
        every { getListDetailUseCase("list-123", any()) } returns errorFlow

        // Act
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
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
        every { getListDetailUseCase("list-123", any()) } returns flowOf(listDetail)
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
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
    fun `retry offline keeps preferCache true and fromCache true`() = runTest(mainDispatcherRule.testDispatcher) {
        val listDetail = createListDetail("list-123", "Retry Offline", 1)
        every { networkMonitor.isConnected } returns flowOf(false)
        every { networkMonitor.isCurrentlyConnected() } returns false
        every { getListDetailUseCase("list-123", true) } returns flowOf(listDetail)

        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        viewModel.retry()
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is ListDetailUiState.Success)
        assertTrue((state as ListDetailUiState.Success).fromCache)
        verify(atLeast = 2) { getListDetailUseCase("list-123", true) }
        verify(exactly = 0) { getListDetailUseCase("list-123", false) }
    }

    @Test
    fun `toggleItemCheck calls checkItemUseCase with correct parameters`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val listDetail = createListDetail("list-123", "Test List", 2)
        every { getListDetailUseCase("list-123", any()) } returns flowOf(listDetail)
        coEvery { checkItemUseCase("list-123", "item-1", true) } returns Unit
        coEvery { syncCheckUseCase("list-123", "item-1", true) } returns SyncCheckResult.Success
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
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
    fun `toggleItemCheck sincroniza cuando monitor reactivo esta desactualizado pero la conectividad actual es true`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val listDetail = createListDetail("list-123", "Test List", 2)
        val connectivityFlow = MutableStateFlow(false)

        every { networkMonitor.isConnected } returns connectivityFlow
        every { networkMonitor.isCurrentlyConnected() } returns true
        coEvery { refreshListDetailIfNeededUseCase(any()) } returns RefreshDetailDecision.SKIP_EQUAL
        every { getListDetailUseCase("list-123", any()) } returns flowOf(listDetail)
        coEvery { checkItemUseCase("list-123", "item-1", true) } returns Unit
        coEvery { syncCheckUseCase("list-123", "item-1", true) } returns SyncCheckResult.Success

        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        // Act
        viewModel.toggleItemCheck("item-1", true)
        advanceUntilIdle()

        // Assert
        coVerify(exactly = 1) { syncCheckUseCase("list-123", "item-1", true) }
    }

    @Test
    fun `toggleItemCheck handles error gracefully`() = runTest(mainDispatcherRule.testDispatcher) {
        // Arrange
        val listDetail = createListDetail("list-123", "Test List", 2)
        every { getListDetailUseCase("list-123", any()) } returns flowOf(listDetail)
        coEvery { checkItemUseCase("list-123", "item-1", true) } throws Exception("Update failed")
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
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
                refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
                completeListUseCase = completeListUseCase,
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

        every { getListDetailUseCase("list-123", any()) } returns flow
        every { calculateTotalUseCase(listDetail1) } returns 10.0
        every { calculateTotalUseCase(listDetail2) } returns 20.0

        // Act
        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
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

    @Test
    fun `loadListDetail triggers entry background refresh only once across multiple Room emissions`() = runTest(mainDispatcherRule.testDispatcher) {
        val listDetail1 = createListDetail("list-123", "Original", 2)
        val listDetail2 = createListDetail("list-123", "Updated", 2)
        every { getListDetailUseCase("list-123", true) } returns flowOf(listDetail1, listDetail2)
        coEvery { refreshListDetailIfNeededUseCase("list-123") } returns RefreshDetailDecision.SKIP_EQUAL

        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        coVerify(exactly = 1) { refreshListDetailIfNeededUseCase("list-123") }
    }

    @Test
    fun `loadListDetail sets permanent refresh error flag on 404 during background refresh`() = runTest(mainDispatcherRule.testDispatcher) {
        val listDetail = createListDetail("list-123", "Test List", 2)
        every { getListDetailUseCase("list-123", any()) } returns flowOf(listDetail)
        coEvery { refreshListDetailIfNeededUseCase("list-123") } throws retrofit2.HttpException(
            retrofit2.Response.error<Any>(404, "error".toResponseBody("text/plain".toMediaType()))
        )

        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        val state = viewModel.uiState.value as ListDetailUiState.Success
        assertTrue(state.hasPermanentRefreshError)
    }

    @Test
    fun `loadListDetail deduplicates concurrent refresh triggers`() = runTest(mainDispatcherRule.testDispatcher) {
        val listDetail = createListDetail("list-123", "Test List", 2)
        val connectivityFlow = MutableStateFlow(false)
        val refreshGate = CompletableDeferred<Unit>()

        every { networkMonitor.isConnected } returns connectivityFlow
        every { networkMonitor.isCurrentlyConnected() } returns true
        every { getListDetailUseCase("list-123", any()) } returns flowOf(listDetail)
        coEvery { refreshListDetailIfNeededUseCase("list-123") } coAnswers {
            refreshGate.await()
            RefreshDetailDecision.SKIP_EQUAL
        }

        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )

        connectivityFlow.value = true
        advanceUntilIdle()

        coVerify(exactly = 1) { refreshListDetailIfNeededUseCase("list-123") }
        refreshGate.complete(Unit)
        advanceUntilIdle()
    }

    @Test
    fun `onCompleteListRequested shows confirmation dialog`() = runTest(mainDispatcherRule.testDispatcher) {
        val listDetail = createListDetail("list-123", "Test List", 2)
        every { getListDetailUseCase("list-123", any()) } returns flowOf(listDetail)

        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()

        viewModel.onCompleteListRequested()

        val state = viewModel.uiState.value as ListDetailUiState.Success
        assertTrue(state.showCompleteConfirmation)
    }

    @Test
    fun `confirmCompleteList deduplicates repeated taps while request is in flight`() = runTest(mainDispatcherRule.testDispatcher) {
        val listDetail = createListDetail("list-123", "Test List", 2).copy(
            items = listOf(
                CatalogItem("item-1", "Item 1", 1.0, true, "2024-01-01", 5.0, "prod-1"),
                CatalogItem("item-2", "Item 2", 1.0, false, "2024-01-01", 5.0, "prod-2")
            )
        )
        val gate = CompletableDeferred<Unit>()
        every { getListDetailUseCase("list-123", any()) } returns flowOf(listDetail)
        coEvery { completeListUseCase("list-123", listOf("item-1")) } coAnswers {
            gate.await()
            CompleteListResult.Success
        }

        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()
        viewModel.onCompleteListRequested()

        viewModel.confirmCompleteList()
        advanceUntilIdle()

        val inFlightState = viewModel.uiState.value as ListDetailUiState.Success
        assertTrue(inFlightState.isCompleting)

        viewModel.confirmCompleteList()
        advanceUntilIdle()

        coVerify(exactly = 1) { completeListUseCase("list-123", listOf("item-1")) }

        gate.complete(Unit)
        advanceUntilIdle()

        val finalState = viewModel.uiState.value as ListDetailUiState.Success
        assertFalse(finalState.isCompleting)
    }

    @Test
    fun `confirmCompleteList sets error message when backend rejects transition`() = runTest(mainDispatcherRule.testDispatcher) {
        val listDetail = createListDetail("list-123", "Test List", 1)
        every { getListDetailUseCase("list-123", any()) } returns flowOf(listDetail)
        coEvery { completeListUseCase("list-123", any()) } returns CompleteListResult.InvalidTransition

        viewModel = DetailViewModel(
            getListDetailUseCase = getListDetailUseCase,
            checkItemUseCase = checkItemUseCase,
            calculateTotalUseCase = calculateTotalUseCase,
            syncCheckUseCase = syncCheckUseCase,
            detectRemoteChangesUseCase = detectRemoteChangesUseCase,
            refreshListDetailIfNeededUseCase = refreshListDetailIfNeededUseCase,
            completeListUseCase = completeListUseCase,
            networkMonitor = networkMonitor,
            savedStateHandle = savedStateHandle
        )
        advanceUntilIdle()
        viewModel.onCompleteListRequested()

        viewModel.confirmCompleteList()
        advanceUntilIdle()

        val state = viewModel.uiState.value as ListDetailUiState.Success
        assertEquals(CompleteListError.INVALID_TRANSITION, state.completeListError)
        assertFalse(state.showCompleteConfirmation)
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
