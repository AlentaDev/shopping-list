package com.alentadev.shopping.feature.auth.ui.login

import com.alentadev.shopping.feature.auth.domain.entity.User

sealed class LoginUiState {
    object Idle : LoginUiState()
    object Loading : LoginUiState()
    data class Success(val user: User) : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}

