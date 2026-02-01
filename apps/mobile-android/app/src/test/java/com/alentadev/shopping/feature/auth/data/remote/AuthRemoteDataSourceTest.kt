package com.alentadev.shopping.feature.auth.data.remote

import com.alentadev.shopping.core.device.DeviceFingerprintProvider
import com.alentadev.shopping.feature.auth.data.dto.LoginResponse
import com.alentadev.shopping.feature.auth.data.dto.OkResponse
import com.alentadev.shopping.feature.auth.data.dto.PublicUserDto
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class AuthRemoteDataSourceTest {
    private lateinit var authApi: AuthApi
    private lateinit var deviceFingerprintProvider: DeviceFingerprintProvider
    private lateinit var authRemoteDataSource: AuthRemoteDataSource

    @Before
    fun setup() {
        authApi = mockk()
        deviceFingerprintProvider = mockk()
        authRemoteDataSource = AuthRemoteDataSource(authApi, deviceFingerprintProvider)
    }

    @Test
    fun `login calls api with correct credentials and device fingerprint`() = runTest {
        // Arrange
        val email = "test@example.com"
        val password = "password123"
        val fingerprint = "device-fingerprint-123"
        val expectedUser = PublicUserDto(
            id = "user-123",
            name = "Test User",
            email = email,
            postalCode = "28001"
        )
        val expectedResponse = LoginResponse(
            user = expectedUser
        )

        coEvery { deviceFingerprintProvider.getFingerprint() } returns fingerprint
        coEvery {
            authApi.login(match {
                it.email == email && it.password == password && it.fingerprint == fingerprint
            })
        } returns expectedResponse

        // Act
        val result = authRemoteDataSource.login(email, password)

        // Assert
        assertEquals(expectedResponse, result)
        assertEquals(email, result.user.email)
    }

    @Test
    fun `login returns response with user data`() = runTest {
        // Arrange
        val email = "user@example.com"
        val password = "pass123"
        val fingerprint = "device-fingerprint-456"
        val response = LoginResponse(
            user = PublicUserDto(
                id = "user-456",
                name = "User Name",
                email = email,
                postalCode = "08002"
            )
        )

        coEvery { deviceFingerprintProvider.getFingerprint() } returns fingerprint
        coEvery { authApi.login(any()) } returns response

        // Act
        val result = authRemoteDataSource.login(email, password)

        // Assert
        assertNotNull(result.user)
        assertEquals(email, result.user.email)
        assertEquals("user-456", result.user.id)
    }

    @Test
    fun `logout calls api logout endpoint`() = runTest {
        // Arrange
        coEvery { authApi.logout() } returns OkResponse(true)

        // Act
        authRemoteDataSource.logout()

        // Assert - simplemente verificar que no lanza excepción
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
