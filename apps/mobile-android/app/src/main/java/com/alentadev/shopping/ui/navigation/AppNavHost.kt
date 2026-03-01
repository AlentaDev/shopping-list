package com.alentadev.shopping.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.compose.ui.Modifier
import com.alentadev.shopping.feature.auth.ui.navigation.LOGIN_ROUTE
import com.alentadev.shopping.feature.auth.ui.navigation.loginScreen
import com.alentadev.shopping.feature.lists.ui.navigation.ACTIVE_LISTS_ROUTE
import com.alentadev.shopping.feature.lists.ui.navigation.activeListsScreen
import com.alentadev.shopping.feature.listdetail.ui.navigation.listDetailScreen
import com.alentadev.shopping.feature.listdetail.ui.navigation.navigateToListDetail

@Composable
fun AppNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = LOGIN_ROUTE,
        modifier = modifier
    ) {
        loginScreen(
            onNavigateToActiveListsScreen = {
                navController.navigate(ACTIVE_LISTS_ROUTE)
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
            }
        )
    }
}
