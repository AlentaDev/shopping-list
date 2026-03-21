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
import com.alentadev.shopping.feature.auth.ui.navigation.LOGIN_ROUTE
import com.alentadev.shopping.feature.auth.ui.navigation.loginScreen
import com.alentadev.shopping.feature.lists.ui.navigation.ACTIVE_LISTS_REFRESH_KEY
import com.alentadev.shopping.feature.lists.ui.navigation.ACTIVE_LISTS_ROUTE
import com.alentadev.shopping.feature.lists.ui.navigation.activeListsScreen
import com.alentadev.shopping.feature.listdetail.ui.navigation.listDetailScreen
import com.alentadev.shopping.feature.listdetail.ui.navigation.navigateToListDetail

private const val SESSION_GATE_ROUTE = "session_gate"

@Composable
fun AppNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier,
    sessionGateViewModel: SessionGateViewModel = hiltViewModel()
) {
    NavHost(
        navController = navController,
        startDestination = SESSION_GATE_ROUTE,
        modifier = modifier
    ) {
        composable(route = SESSION_GATE_ROUTE) {
            SessionGateRoute(
                onNavigateToLogin = {
                    navController.navigate(LOGIN_ROUTE) {
                        popUpTo(SESSION_GATE_ROUTE) { inclusive = true }
                    }
                },
                onNavigateToActiveLists = {
                    navController.navigate(ACTIVE_LISTS_ROUTE) {
                        popUpTo(SESSION_GATE_ROUTE) { inclusive = true }
                    }
                },
                sessionGateViewModel = sessionGateViewModel
            )
        }
        loginScreen(
            onNavigateToActiveListsScreen = {
                navController.navigate(ACTIVE_LISTS_ROUTE) {
                    popUpTo(LOGIN_ROUTE) { inclusive = true }
                }
            }
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
private fun SessionGateRoute(
    onNavigateToLogin: () -> Unit,
    onNavigateToActiveLists: () -> Unit,
    sessionGateViewModel: SessionGateViewModel
) {
    val state by sessionGateViewModel.state.collectAsState()

    LaunchedEffect(state) {
        when (state) {
            AuthBootstrapState.Authenticated,
            AuthBootstrapState.OfflineRecoverable -> onNavigateToActiveLists()
            AuthBootstrapState.Unauthenticated -> onNavigateToLogin()
            AuthBootstrapState.Unknown,
            AuthBootstrapState.Checking -> Unit
        }
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}
