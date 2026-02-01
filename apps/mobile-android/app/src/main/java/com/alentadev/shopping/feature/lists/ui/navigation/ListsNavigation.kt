package com.alentadev.shopping.feature.lists.ui.navigation

import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.compose.composable
import com.alentadev.shopping.feature.lists.ui.list.ActiveListsScreen

const val ACTIVE_LISTS_ROUTE = "active_lists"

fun NavGraphBuilder.activeListsScreen() {
    composable(route = ACTIVE_LISTS_ROUTE) {
        ActiveListsScreen()
    }
}

fun NavController.navigateToActiveLists() {
    navigate(ACTIVE_LISTS_ROUTE) {
        popUpTo(0)  // Limpia el back stack
    }
}

