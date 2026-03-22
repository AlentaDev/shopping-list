package com.alentadev.shopping.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.alentadev.shopping.feature.auth.ui.navigation.LOGIN_ROUTE_PATTERN
import com.alentadev.shopping.feature.auth.ui.navigation.loginScreen
import com.alentadev.shopping.feature.auth.ui.navigation.loginRoute
import com.alentadev.shopping.feature.lists.ui.navigation.ACTIVE_LISTS_REFRESH_KEY
import com.alentadev.shopping.feature.lists.ui.navigation.ACTIVE_LISTS_ROUTE
import com.alentadev.shopping.feature.lists.ui.navigation.activeListsScreen
import com.alentadev.shopping.feature.listdetail.ui.navigation.listDetailScreen
import com.alentadev.shopping.feature.listdetail.ui.navigation.navigateToListDetail

const val BOOTSTRAP_ROUTE = "bootstrap"

@Composable
fun AppNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier,
    sessionGateViewModel: SessionGateViewModel = hiltViewModel()
) {
    val bootstrapState by sessionGateViewModel.state.collectAsState()

    LaunchedEffect(bootstrapState) {
        if (bootstrapState == AuthBootstrapState.Authenticated) {
            navController.navigate(ACTIVE_LISTS_ROUTE) {
                popUpTo(LOGIN_ROUTE_PATTERN) { inclusive = true }
                popUpTo(BOOTSTRAP_ROUTE) { inclusive = true }
                launchSingleTop = true
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = BOOTSTRAP_ROUTE,
        modifier = modifier
    ) {
        composable(route = BOOTSTRAP_ROUTE) {
            BootstrapRoute(
                onNavigateToLogin = {
                    navController.navigate(loginRoute(recoverableMode = false)) {
                        popUpTo(BOOTSTRAP_ROUTE) { inclusive = true }
                    }
                },
                onNavigateToRecoverableLogin = {
                    navController.navigate(loginRoute(recoverableMode = true)) {
                        popUpTo(BOOTSTRAP_ROUTE) { inclusive = true }
                    }
                },
                onNavigateToActiveLists = {
                    navController.navigate(ACTIVE_LISTS_ROUTE)
                },
                sessionGateViewModel = sessionGateViewModel
            )
        }
        loginScreen(
            onNavigateToActiveListsScreen = {
                navController.navigate(ACTIVE_LISTS_ROUTE) {
                    popUpTo(LOGIN_ROUTE_PATTERN) { inclusive = true }
                }
            },
            isRecoverableRetrying = bootstrapState == AuthBootstrapState.Checking
        )
        activeListsScreen(
            onNavigateToDetail = { listId ->
                navController.navigateToListDetail(listId)
            }
        )
        listDetailScreen(
            onBackClick = {
                navController.popBackStack()
            },
            onListCompleted = {
                navController.previousBackStackEntry
                    ?.savedStateHandle
                    ?.set(ACTIVE_LISTS_REFRESH_KEY, System.currentTimeMillis())
                navController.popBackStack()
            }
        )
    }
}

@Composable
private fun BootstrapRoute(
    onNavigateToLogin: () -> Unit,
    onNavigateToRecoverableLogin: () -> Unit,
    onNavigateToActiveLists: () -> Unit,
    sessionGateViewModel: SessionGateViewModel
) {
    val state by sessionGateViewModel.state.collectAsState()

    LaunchedEffect(state) {
        when (resolveBootstrapDestination(state)) {
            ACTIVE_LISTS_ROUTE -> onNavigateToActiveLists()
            loginRoute(recoverableMode = false) -> onNavigateToLogin()
            loginRoute(recoverableMode = true) -> onNavigateToRecoverableLogin()
            null -> Unit
        }
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}

internal fun resolveBootstrapDestination(state: AuthBootstrapState): String? =
    when (state) {
        AuthBootstrapState.Authenticated -> ACTIVE_LISTS_ROUTE
        AuthBootstrapState.Unauthenticated -> loginRoute(recoverableMode = false)
        AuthBootstrapState.OfflineRecoverable -> loginRoute(recoverableMode = true)
        AuthBootstrapState.Unknown,
        AuthBootstrapState.Checking -> null
    }
