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

class GetCurrentUserUseCaseTest {
    private lateinit var authRepository: AuthRepository
    private lateinit var getCurrentUserUseCase: GetCurrentUserUseCase

    @Before
    fun setup() {
        authRepository = mockk()
        getCurrentUserUseCase = GetCurrentUserUseCase(authRepository)
    }

    @Test
    fun `execute returns current user when authenticated`() = runTest {
        // Arrange
        val expectedUser = User(
            id = "user-789",
            name = "Current User",
            email = "current@example.com",
            postalCode = "46001"
        )
        val session = Session(user = expectedUser)

        coEvery { authRepository.getCurrentSession() } returns session

        // Act
        val result = getCurrentUserUseCase.execute()

        // Assert
        assertEquals(expectedUser, result)
        assertEquals("user-789", result.id)
        assertEquals("current@example.com", result.email)
    }

    @Test
    fun `execute throws exception when not authenticated`() = runTest {
        // Arrange
        val exception = IllegalStateException("User not authenticated")

        coEvery { authRepository.getCurrentSession() } throws exception

        // Act & Assert
        try {
            getCurrentUserUseCase.execute()
            fail("Should have thrown IllegalStateException")
        } catch (e: IllegalStateException) {
            // Expected
        }
    }

    @Test
    fun `execute returns user with all fields populated`() = runTest {
        // Arrange
        val expectedUser = User(
            id = "user-999",
            name = "Test User Full",
            email = "full@example.com",
            postalCode = "41001"
        )
        val session = Session(user = expectedUser)

        coEvery { authRepository.getCurrentSession() } returns session

        // Act
        val result = getCurrentUserUseCase.execute()

        // Assert
        assertEquals("user-999", result.id)
        assertEquals("Test User Full", result.name)
        assertEquals("full@example.com", result.email)
        assertEquals("41001", result.postalCode)
    }
}

