package com.alentadev.shopping.feature.lists.domain.entity

/**
 * Resultado de cargar listas activas con metadata de origen.
 */
data class ActiveListsResult(
    val lists: List<ShoppingList>,
    val fromCache: Boolean
)

