package com.alentadev.shopping.feature.lists.ui.list

import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList

sealed class ListsUiState {
    object Loading : ListsUiState()
    data class Success(
        val lists: List<ShoppingList>,
        val fromCache: Boolean = false
    ) : ListsUiState()
    object Empty : ListsUiState()
    data class Error(val message: String) : ListsUiState()
}

