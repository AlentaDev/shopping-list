package com.alentadev.shopping.feature.lists.data.dto

import kotlinx.serialization.Serializable

/**
 * DTO para una lista de compras desde el servidor
 * Representa el resumen de una lista sin detalles de items
 */
@Serializable
data class ListSummaryDto(
    val id: String,
    val title: String,
    val status: String,  // "ACTIVE", "DRAFT", "COMPLETED"
    val updatedAt: Long,
    val itemCount: Int = 0
)

