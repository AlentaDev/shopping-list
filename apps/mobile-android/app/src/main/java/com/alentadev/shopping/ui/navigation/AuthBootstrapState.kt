package com.alentadev.shopping.ui.navigation

sealed interface AuthBootstrapState {
    data object Unknown : AuthBootstrapState
    data object Checking : AuthBootstrapState
    data object Authenticated : AuthBootstrapState
    data object Unauthenticated : AuthBootstrapState
    data object OfflineRecoverable : AuthBootstrapState
}
