package com.alentadev.shopping.feature.auth.data.repository

import com.alentadev.shopping.feature.auth.data.dto.LoginResponse
import com.alentadev.shopping.feature.auth.data.dto.PublicUserDto
import com.alentadev.shopping.feature.auth.data.local.AuthLocalDataSource
import com.alentadev.shopping.feature.auth.data.remote.AuthRemoteDataSource
import com.alentadev.shopping.feature.auth.domain.entity.Session
import com.alentadev.shopping.feature.auth.domain.entity.User
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class AuthRepositoryImplTest {
    private lateinit var remoteDataSource: AuthRemoteDataSource
    private lateinit var localDataSource: AuthLocalDataSource
    private lateinit var authRepository: AuthRepositoryImpl

    @Before
    fun setup() {
        remoteDataSource = mockk()
        localDataSource = mockk()
        authRepository = AuthRepositoryImpl(remoteDataSource, localDataSource)
    }

    @Test
    fun `login with valid credentials saves session locally`() = runTest {
        // Arrange
        val email = "test@example.com"
        val password = "password123"
        val userDto = PublicUserDto(
            id = "user-123",
            name = "Test User",
            email = email,
            postalCode = "28001"
        )
        val response = LoginResponse(
            user = userDto
        )

        coEvery { remoteDataSource.login(email, password) } returns response
        coEvery { localDataSource.saveSession(any()) } returns Unit
        coEvery { localDataSource.saveAccessToken(any()) } returns Unit

        // Act
        val result = authRepository.login(email, password)

        // Assert
        assertEquals("user-123", result.user.id)
        assertEquals(email, result.user.email)
        coVerify { localDataSource.saveSession(any()) }
        coVerify(exactly = 0) { localDataSource.saveAccessToken(any()) }
    }

    @Test
    fun `login returns session with authenticated flag true`() = runTest {
        // Arrange
        val email = "user@example.com"
        val password = "pass123"
        val response = LoginResponse(
            user = PublicUserDto(
                id = "user-456",
                name = "User Name",
                email = email,
                postalCode = "08002"
            )
        )

        coEvery { remoteDataSource.login(email, password) } returns response
        coEvery { localDataSource.saveSession(any()) } returns Unit

        // Act
        val result = authRepository.login(email, password)

        // Assert
        assertTrue(result.isAuthenticated)
    }

    @Test
    fun `login with 401 throws illegal argument exception`() = runTest {
        // Arrange
        val email = "test@example.com"
        val password = "wrongpass"

        coEvery {
            remoteDataSource.login(email, password)
        } throws Exception("401 Unauthorized")

        // Act & Assert
        try {
            authRepository.login(email, password)
            fail("Should have thrown IllegalArgumentException")
        } catch (e: IllegalArgumentException) {
            assertEquals("Credenciales inválidas", e.message)
        }
    }

    @Test
    fun `logout calls remote logout then clears local session`() = runTest {
        // Arrange
        coEvery { remoteDataSource.logout() } returns Unit
        coEvery { localDataSource.clearSession() } returns Unit

        // Act
        authRepository.logout()

        // Assert
        coVerify(exactly = 1) { remoteDataSource.logout() }
        coVerify(exactly = 1) { localDataSource.clearSession() }
    }

    @Test
    fun `logout clears session even if remote call fails`() = runTest {
        // Arrange
        coEvery { remoteDataSource.logout() } throws Exception("Network error")
        coEvery { localDataSource.clearSession() } returns Unit

        // Act
        authRepository.logout()

        // Assert
        coVerify { localDataSource.clearSession() }
    }

    @Test
    fun `getCurrentSession returns user from remote`() = runTest {
        // Arrange
        val userDto = PublicUserDto(
            id = "user-789",
            name = "Current User",
            email = "current@example.com",
            postalCode = "46001"
        )

        coEvery { remoteDataSource.getCurrentUser() } returns userDto

        // Act
        val result = authRepository.getCurrentSession()

        // Assert
        assertEquals("user-789", result.user.id)
        assertEquals("current@example.com", result.user.email)
    }

    @Test
    fun `getCurrentSession returns cached session on remote error`() = runTest {
        // Arrange
        val cachedUser = User(
            id = "user-cached",
            name = "Cached User",
            email = "cached@example.com",
            postalCode = "41001"
        )
        val cachedSession = Session(user = cachedUser)

        coEvery { remoteDataSource.getCurrentUser() } throws Exception("Network error")
        coEvery { localDataSource.getSession() } returns flowOf(cachedSession)

        // Act
        val result = authRepository.getCurrentSession()

        // Assert
        assertEquals("user-cached", result.user.id)
        assertEquals("cached@example.com", result.user.email)
    }

    @Test
    fun `getCurrentSession throws when no session found`() = runTest {
        // Arrange
        coEvery { remoteDataSource.getCurrentUser() } throws Exception("Not authorized")
        coEvery { localDataSource.getSession() } returns flowOf(null)

        // Act & Assert
        try {
            authRepository.getCurrentSession()
            fail("Should have thrown IllegalStateException")
        } catch (e: IllegalStateException) {
            assertEquals("User not authenticated", e.message)
        }
    }
}
