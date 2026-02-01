package com.alentadev.shopping.feature.auth.ui.navigation

import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import com.alentadev.shopping.feature.auth.ui.login.LoginScreen

const val LOGIN_ROUTE = "login"

fun NavGraphBuilder.loginScreen(
    onNavigateToActiveListsScreen: () -> Unit
) {
    composable(route = LOGIN_ROUTE) {
        LoginScreen(
            onLoginSuccess = {
                onNavigateToActiveListsScreen()
            }
        )
    }
}



