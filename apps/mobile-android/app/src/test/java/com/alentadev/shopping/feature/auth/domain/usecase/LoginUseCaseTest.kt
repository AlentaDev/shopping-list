package com.alentadev.shopping.feature.auth.domain.usecase

import com.alentadev.shopping.feature.auth.domain.entity.Session
import com.alentadev.shopping.feature.auth.domain.entity.User
import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class LoginUseCaseTest {
    private lateinit var authRepository: AuthRepository
    private lateinit var loginUseCase: LoginUseCase

    @Before
    fun setup() {
        authRepository = mockk()
        loginUseCase = LoginUseCase(authRepository)
    }

    @Test
    fun `execute with valid credentials returns session`() = runTest {
        // Arrange
        val email = "test@example.com"
        val password = "password123"
        val expectedUser = User(
            id = "user-123",
            name = "Test User",
            email = email,
            postalCode = "28001"
        )
        val expectedSession = Session(user = expectedUser)

        coEvery { authRepository.login(email, password) } returns expectedSession

        // Act
        val result = loginUseCase.execute(email, password)

        // Assert
        assertEquals(expectedSession, result)
        assertNotNull(result.user)
        assertEquals(email, result.user.email)
    }

    @Test
    fun `execute with invalid credentials throws exception`() = runTest {
        // Arrange
        val email = "test@example.com"
        val password = "wrongpassword"
        val exception = IllegalArgumentException("Invalid credentials")

        coEvery { authRepository.login(email, password) } throws exception

        // Act & Assert
        try {
            loginUseCase.execute(email, password)
            fail("Should have thrown IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            // Expected
        }
    }

    @Test
    fun `execute with empty email throws exception`() = runTest {
        // Arrange
        val email = ""
        val password = "password123"

        // Act & Assert
        try {
            loginUseCase.execute(email, password)
            fail("Should have thrown IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            // Expected
        }
    }

    @Test
    fun `execute with empty password throws exception`() = runTest {
        // Arrange
        val email = "test@example.com"
        val password = ""

        // Act & Assert
        try {
            loginUseCase.execute(email, password)
            fail("Should have thrown IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            // Expected
        }
    }

    @Test
    fun `execute with invalid email format throws exception`() = runTest {
        // Arrange
        val email = "invalid-email"
        val password = "password123"

        // Act & Assert
        try {
            loginUseCase.execute(email, password)
            fail("Should have thrown IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            // Expected
        }
    }

    @Test
    fun `execute returns session with authenticated flag true`() = runTest {
        // Arrange
        val email = "test@example.com"
        val password = "password123"
        val expectedUser = User(
            id = "user-456",
            name = "Another User",
            email = email,
            postalCode = "08002"
        )
        val expectedSession = Session(user = expectedUser)

        coEvery { authRepository.login(email, password) } returns expectedSession

        // Act
        val result = loginUseCase.execute(email, password)

        // Assert
        assertTrue(result.isAuthenticated)
    }
}

