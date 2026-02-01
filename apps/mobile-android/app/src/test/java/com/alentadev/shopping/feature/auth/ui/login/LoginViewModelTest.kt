package com.alentadev.shopping.feature.auth.ui.login

import com.alentadev.shopping.feature.auth.domain.entity.Session
import com.alentadev.shopping.feature.auth.domain.entity.User
import com.alentadev.shopping.feature.auth.domain.usecase.LoginUseCase
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestWatcher
import org.junit.runner.Description

class LoginViewModelTest {
    private lateinit var loginUseCase: LoginUseCase
    private lateinit var viewModel: LoginViewModel

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Before
    fun setup() {
        loginUseCase = mockk()
        viewModel = LoginViewModel(loginUseCase)
    }

    @Test
    fun `onLoginClicked with valid credentials shows success`() = runTest {
        // Arrange
        val email = "test@example.com"
        val password = "password123"
        val user = User(
            id = "user-123",
            name = "Test User",
            email = email,
            postalCode = "28001"
        )
        val session = Session(user = user)

        coEvery { loginUseCase.execute(email, password) } returns session

        viewModel.onEmailChanged(email)
        viewModel.onPasswordChanged(password)

        // Act
        viewModel.onLoginClicked()
        mainDispatcherRule.testDispatcher.scheduler.advanceUntilIdle()

        // Assert
        val state = viewModel.uiState.value
        assertTrue(state is LoginUiState.Success)
        assertEquals(user.email, (state as LoginUiState.Success).user.email)
    }

    @Test
    fun `onLoginClicked with empty email shows error`() = runTest {
        // Arrange
        viewModel.onEmailChanged("")
        viewModel.onPasswordChanged("password123")

        // Act
        viewModel.onLoginClicked()

        // Assert
        val state = viewModel.uiState.value
        assertTrue(state is LoginUiState.Error)
        assertEquals("El email no puede estar vacío", (state as LoginUiState.Error).message)
    }

    @Test
    fun `onLoginClicked with empty password shows error`() = runTest {
        // Arrange
        viewModel.onEmailChanged("test@example.com")
        viewModel.onPasswordChanged("")

        // Act
        viewModel.onLoginClicked()

        // Assert
        val state = viewModel.uiState.value
        assertTrue(state is LoginUiState.Error)
        assertEquals("La contraseña no puede estar vacía", (state as LoginUiState.Error).message)
    }

    @Test
    fun `onLoginClicked with invalid email format shows error`() = runTest {
        // Arrange
        viewModel.onEmailChanged("invalidemail")
        viewModel.onPasswordChanged("password123")

        // Act
        viewModel.onLoginClicked()

        // Assert
        val state = viewModel.uiState.value
        assertTrue(state is LoginUiState.Error)
        assertEquals("Formato de email inválido", (state as LoginUiState.Error).message)
    }

    @Test
    fun `onLoginClicked with invalid credentials shows error`() = runTest {
        // Arrange
        val email = "test@example.com"
        val password = "wrongpassword"

        coEvery {
            loginUseCase.execute(email, password)
        } throws IllegalArgumentException("Credenciales inválidas")

        viewModel.onEmailChanged(email)
        viewModel.onPasswordChanged(password)

        // Act
        viewModel.onLoginClicked()
        mainDispatcherRule.testDispatcher.scheduler.advanceUntilIdle()

        // Assert
        val state = viewModel.uiState.value
        assertTrue(state is LoginUiState.Error)
        assertEquals("Credenciales inválidas", (state as LoginUiState.Error).message)
    }

    @Test
    fun `onPasswordChanged updates password state`() {
        // Arrange
        val newPassword = "newpassword"

        // Act
        viewModel.onPasswordChanged(newPassword)

        // Assert
        assertEquals(newPassword, viewModel.password.value)
    }

    @Test
    fun `onLoginClicked with network error shows appropriate message`() = runTest {
        // Arrange
        val email = "test@example.com"
        val password = "password123"

        coEvery {
            loginUseCase.execute(email, password)
        } throws Exception("Connection timeout")

        viewModel.onEmailChanged(email)
        viewModel.onPasswordChanged(password)

        // Act
        viewModel.onLoginClicked()
        mainDispatcherRule.testDispatcher.scheduler.advanceUntilIdle()

        // Assert
        val state = viewModel.uiState.value
        assertTrue(state is LoginUiState.Error)
        assertTrue((state as LoginUiState.Error).message.contains("Error de conexión"))
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