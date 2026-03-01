package com.alentadev.shopping.feature.listdetail.ui.navigation

import androidx.navigation.NavController
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.alentadev.shopping.feature.listdetail.ui.detail.ListDetailScreen

const val LIST_DETAIL_ROUTE = "list_detail"
const val LIST_ID_ARG = "listId"

/**
 * Ruta completa con argumento para navegación
 */
private const val LIST_DETAIL_ROUTE_WITH_ARGS = "$LIST_DETAIL_ROUTE/{$LIST_ID_ARG}"

/**
 * Agrega la pantalla de detalle de lista al grafo de navegación
 */
fun NavGraphBuilder.listDetailScreen(
    onBackClick: () -> Unit
) {
    composable(
        route = LIST_DETAIL_ROUTE_WITH_ARGS,
        arguments = listOf(
            navArgument(LIST_ID_ARG) {
                type = NavType.StringType
            }
        )
    ) {
        ListDetailScreen(onBackClick = onBackClick)
    }
}

/**
 * Navega a la pantalla de detalle de lista
 *
 * @param listId ID de la lista a mostrar
 */
fun NavController.navigateToListDetail(listId: String) {
    navigate("$LIST_DETAIL_ROUTE/$listId")
}

