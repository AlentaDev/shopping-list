package com.alentadev.shopping.feature.auth.domain.usecase

import com.alentadev.shopping.feature.auth.domain.session.SessionWarmUpOrchestrator
import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test

class LogoutUseCaseTest {
    private lateinit var authRepository: AuthRepository
    private lateinit var sessionWarmUpOrchestrator: SessionWarmUpOrchestrator
    private lateinit var logoutUseCase: LogoutUseCase

    @Before
    fun setup() {
        authRepository = mockk()
        sessionWarmUpOrchestrator = mockk(relaxed = true)
        logoutUseCase = LogoutUseCase(authRepository, sessionWarmUpOrchestrator)
    }

    @Test
    fun `execute calls repository logout`() = runTest {
        // Arrange
        coEvery { authRepository.logout() } returns Unit

        // Act
        logoutUseCase.execute()

        // Assert
        io.mockk.verify(exactly = 1) { sessionWarmUpOrchestrator.cancelWarmUp() }
        coVerify(exactly = 1) { authRepository.logout() }
    }

    @Test
    fun `execute clears session data`() = runTest {
        // Arrange
        coEvery { authRepository.logout() } returns Unit

        // Act
        logoutUseCase.execute()

        // Assert - Verifica que logout fue llamado
        coVerify { authRepository.logout() }
    }
}
