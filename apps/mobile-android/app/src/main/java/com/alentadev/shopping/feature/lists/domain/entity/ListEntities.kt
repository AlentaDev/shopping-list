package com.alentadev.shopping.feature.lists.domain.entity

import kotlinx.serialization.Serializable

/**
 * Estados posibles de una lista de compras
 */
@Serializable
enum class ListStatus {
    DRAFT,      // En proceso de creación
    ACTIVE,     // Activa, se está comprando
    COMPLETED   // Completada
}

/**
 * Entidad de dominio para una lista de compras
 * Representa una lista en la capa de negocio (sin detalles de persistencia)
 */
@Serializable
data class ShoppingList(
    val id: String,
    val title: String,
    val status: ListStatus,
    val updatedAt: Long,  // timestamp en milisegundos
    val itemCount: Int = 0,  // cantidad de items
    val providerName: String = ""
) {
    /**
     * Verifica si la lista está activa
     */
    fun isActive(): Boolean = status == ListStatus.ACTIVE

    /**
     * Verifica si la lista está completada
     */
    fun isCompleted(): Boolean = status == ListStatus.COMPLETED
}
