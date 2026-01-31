package com.alentadev.shopping.feature.lists.domain.entity

enum class ListStatus {
    DRAFT,
    ACTIVE,
    COMPLETED
}

data class ShoppingList(
    val id: String,
    val title: String,
    val status: ListStatus,
    val updatedAt: String
)

