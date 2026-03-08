package com.alentadev.shopping.feature.auth.domain.usecase

import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test

class LogoutUseCaseTest {
    private lateinit var authRepository: AuthRepository
    private lateinit var logoutUseCase: LogoutUseCase

    @Before
    fun setup() {
        authRepository = mockk()
        logoutUseCase = LogoutUseCase(authRepository)
    }

    @Test
    fun `execute calls repository logout`() = runTest {
        coEvery { authRepository.logout() } returns Unit

        logoutUseCase.execute()

        coVerify(exactly = 1) { authRepository.logout() }
    }
}
