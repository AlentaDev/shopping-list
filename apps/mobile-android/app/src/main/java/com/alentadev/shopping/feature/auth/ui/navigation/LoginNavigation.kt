package com.alentadev.shopping.feature.auth.ui.navigation

import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.alentadev.shopping.feature.auth.ui.login.LoginScreen

const val LOGIN_ROUTE = "login"
private const val RECOVERABLE_MODE_ARG = "recoverable"
const val LOGIN_ROUTE_PATTERN = "$LOGIN_ROUTE?$RECOVERABLE_MODE_ARG={$RECOVERABLE_MODE_ARG}"

fun loginRoute(recoverableMode: Boolean): String =
    "$LOGIN_ROUTE?$RECOVERABLE_MODE_ARG=$recoverableMode"

fun NavGraphBuilder.loginScreen(
    onNavigateToActiveListsScreen: () -> Unit,
    isRecoverableRetrying: Boolean
) {
    composable(
        route = LOGIN_ROUTE_PATTERN,
        arguments = listOf(
            navArgument(RECOVERABLE_MODE_ARG) {
                type = NavType.BoolType
                defaultValue = false
            }
        )
    ) { backStackEntry ->
        val recoverableMode = backStackEntry.arguments?.getBoolean(RECOVERABLE_MODE_ARG) ?: false
        LoginScreen(
            recoverableMode = recoverableMode,
            isRecoverableRetrying = isRecoverableRetrying,
            onLoginSuccess = {
                onNavigateToActiveListsScreen()
            }
        )
    }
}
