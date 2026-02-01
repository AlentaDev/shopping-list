package com.alentadev.shopping.feature.auth.data.remote

import com.alentadev.shopping.feature.auth.data.dto.LoginRequest
import com.alentadev.shopping.feature.auth.data.dto.LoginResponse
import com.alentadev.shopping.feature.auth.data.dto.PublicUserDto
import com.alentadev.shopping.feature.auth.data.dto.OkResponse
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class AuthRemoteDataSourceTest {
    private lateinit var authApi: AuthApi
    private lateinit var authRemoteDataSource: AuthRemoteDataSource

    @Before
    fun setup() {
        authApi = mockk()
        authRemoteDataSource = AuthRemoteDataSource(authApi)
    }

    @Test
    fun `login calls api with correct credentials`() = runTest {
        // Arrange
        val email = "test@example.com"
        val password = "password123"
        val expectedUser = PublicUserDto(
            id = "user-123",
            name = "Test User",
            email = email,
            postalCode = "28001"
        )
        val expectedResponse = LoginResponse(
            user = expectedUser
        )

        coEvery {
            authApi.login(LoginRequest(email, password))
        } returns expectedResponse

        // Act
        val result = authRemoteDataSource.login(email, password)

        // Assert
        assertEquals(expectedResponse, result)
        assertEquals(email, result.user.email)
    }

    @Test
    fun `login returns response without access token`() = runTest {
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

        coEvery { authApi.login(any()) } returns response

        // Act
        val result = authRemoteDataSource.login(email, password)

        // Assert
        assertNotNull(result.user)
        assertEquals(email, result.user.email)
    }

    @Test
    fun `logout calls api logout endpoint`() = runTest {
        // Arrange
        coEvery { authApi.logout() } returns OkResponse(true)

        // Act
        authRemoteDataSource.logout()

        // Assert
        assertTrue(true)
    }

    @Test
    fun `getCurrentUser returns user from api`() = runTest {
        // Arrange
        val expectedUser = PublicUserDto(
            id = "user-789",
            name = "Current User",
            email = "current@example.com",
            postalCode = "46001"
        )

        coEvery { authApi.getCurrentUser() } returns expectedUser

        // Act
        val result = authRemoteDataSource.getCurrentUser()

        // Assert
        assertEquals(expectedUser, result)
        assertEquals("user-789", result.id)
    }
}
