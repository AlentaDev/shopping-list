package com.alentadev.shopping.feature.auth.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.alentadev.shopping.feature.auth.domain.usecase.LoginUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    private val _email = MutableStateFlow("")
    val email: StateFlow<String> = _email.asStateFlow()

    private val _password = MutableStateFlow("")
    val password: StateFlow<String> = _password.asStateFlow()

    fun onEmailChanged(newEmail: String) {
        _email.value = newEmail
    }

    fun onPasswordChanged(newPassword: String) {
        _password.value = newPassword
    }

    fun onLoginClicked() {
        // Validaciones
        val email = _email.value.trim()
        val password = _password.value

        if (email.isEmpty()) {
            _uiState.value = LoginUiState.Error("El email no puede estar vacío")
            return
        }

        if (password.isEmpty()) {
            _uiState.value = LoginUiState.Error("La contraseña no puede estar vacía")
            return
        }

        if (!isValidEmail(email)) {
            _uiState.value = LoginUiState.Error("Formato de email inválido")
            return
        }

        // Llamar al use case
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading

            try {
                val session = loginUseCase.execute(email, password)
                _uiState.value = LoginUiState.Success(session.user)
            } catch (_: IllegalArgumentException) {
                _uiState.value = LoginUiState.Error("Credenciales inválidas")
            } catch (e: Exception) {
                _uiState.value = LoginUiState.Error(
                    when {
                        e.message?.contains("Connection") == true -> "Error de conexión. Reintentando..."
                        e.message?.contains("timeout") == true -> "Timeout. Por favor intenta de nuevo."
                        else -> "Error: ${e.message ?: "Desconocido"}"
                    }
                )
            }
        }
    }

    private fun isValidEmail(email: String): Boolean {
        return email.contains("@") && email.contains(".")
    }
}

