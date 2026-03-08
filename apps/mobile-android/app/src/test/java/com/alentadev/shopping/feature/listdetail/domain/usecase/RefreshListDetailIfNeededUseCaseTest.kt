package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import com.alentadev.shopping.feature.sync.domain.UpdatedAtComparator
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class RefreshListDetailIfNeededUseCaseTest {
    private val repository = mockk<ListDetailRepository>(relaxed = true)
    private val useCase = RefreshListDetailIfNeededUseCase(repository, UpdatedAtComparator())

    @Test
    fun `invoke refreshes when local snapshot is missing`() = runTest {
        coEvery { repository.getCachedListUpdatedAt("l1") } returns null
        coEvery { repository.getRemoteListUpdatedAt("l1") } returns "2025-01-01T10:00:00Z"

        val result = useCase("l1")

        assertEquals(RefreshDetailDecision.FETCH_MISSING, result)
        coVerify { repository.refreshListDetail("l1") }
    }

    @Test
    fun `invoke refreshes when remote updatedAt is newer`() = runTest {
        coEvery { repository.getCachedListUpdatedAt("l1") } returns "2025-01-01T10:00:00Z"
        coEvery { repository.getRemoteListUpdatedAt("l1") } returns "2025-01-01T10:01:00Z"

        val result = useCase("l1")

        assertEquals(RefreshDetailDecision.REFRESH_REMOTE_NEWER, result)
        coVerify(exactly = 1) { repository.refreshListDetail("l1") }
    }

    @Test
    fun `invoke skips refresh when updatedAt is equal or older`() = runTest {
        coEvery { repository.getCachedListUpdatedAt("l1") } returns "2025-01-01T10:00:00Z"
        coEvery { repository.getRemoteListUpdatedAt("l1") } returns "2025-01-01T10:00:00Z"

        val result = useCase("l1")

        assertEquals(RefreshDetailDecision.SKIP_EQUAL, result)
        coVerify(exactly = 0) { repository.refreshListDetail(any()) }
    }

    @Test
    fun `invoke skips refresh when updatedAt is invalid`() = runTest {
        coEvery { repository.getCachedListUpdatedAt("l1") } returns "bad-local"
        coEvery { repository.getRemoteListUpdatedAt("l1") } returns "bad-remote"

        val result = useCase("l1")

        assertEquals(RefreshDetailDecision.SKIP_EQUAL, result)
        coVerify(exactly = 0) { repository.refreshListDetail(any()) }
    }
}
