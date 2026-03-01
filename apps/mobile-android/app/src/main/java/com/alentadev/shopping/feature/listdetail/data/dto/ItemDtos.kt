package com.alentadev.shopping.feature.listdetail.data.dto

import kotlinx.serialization.Serializable

/**
 * DTO base para items de una lista
 * Contiene campos comunes y campos opcionales específicos de catálogo
 */
@Serializable
data class ListItemDto(
    val id: String,
    val kind: String, // "catalog" | "manual"
    val name: String,
    val qty: Double,
    val checked: Boolean,
    val updatedAt: String,
    val note: String? = null,
    // Campos específicos de items de catálogo
    val thumbnail: String? = null,
    val price: Double? = null,
    val source: String? = null, // "mercadona"
    val sourceProductId: String? = null,
    val unitSize: Double? = null,
    val unitFormat: String? = null,
    val unitPrice: Double? = null,
    val isApproxSize: Boolean = false
)

/**
 * DTO de respuesta para detalle de lista con items
 * Incluye información de la lista + array de items
 */
@Serializable
data class ListDetailDto(
    val id: String,
    val title: String,
    val status: String, // "ACTIVE", "DRAFT", "COMPLETED"
    val isEditing: Boolean = false,
    val activatedAt: String? = null,
    val itemCount: Int = 0,
    val items: List<ListItemDto> = emptyList(),
    val updatedAt: String
)

