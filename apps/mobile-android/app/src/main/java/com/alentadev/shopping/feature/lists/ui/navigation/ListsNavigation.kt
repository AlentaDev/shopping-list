package com.alentadev.shopping.feature.lists.ui.navigation

import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import com.alentadev.shopping.feature.lists.ui.list.ActiveListsScreen

const val ACTIVE_LISTS_ROUTE = "active_lists"
const val ACTIVE_LISTS_REFRESH_KEY = "active_lists_refresh_key"

fun NavGraphBuilder.activeListsScreen(
    onNavigateToDetail: (String) -> Unit
) {
    composable(route = ACTIVE_LISTS_ROUTE) { backStackEntry ->
        ActiveListsScreen(
            onNavigateToDetail = onNavigateToDetail,
            refreshSignal = backStackEntry.savedStateHandle.get<Long?>(ACTIVE_LISTS_REFRESH_KEY),
            onRefreshSignalConsumed = {
                backStackEntry.savedStateHandle[ACTIVE_LISTS_REFRESH_KEY] = null
            }
        )
    }
}

fun NavController.navigateToActiveLists() {
    navigate(ACTIVE_LISTS_ROUTE) {
        popUpTo(0)  // Limpia el back stack
    }
}

