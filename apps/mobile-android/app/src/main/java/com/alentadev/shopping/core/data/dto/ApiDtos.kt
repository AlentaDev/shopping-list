package com.alentadev.shopping.core.data.dto

import kotlinx.serialization.Serializable

// ============================================================================
// AUTH DTOS
// ============================================================================

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class PublicUser(
    val id: String,
    val name: String,
    val email: String,
    val postalCode: String
)

@Serializable
data class OkResponse(
    val ok: Boolean = true
)

// ============================================================================
// LIST DTOS
// ============================================================================

@Serializable
data class ListSummary(
    val id: String,
    val title: String,
    val updatedAt: String
)

@Serializable
data class ListListsResponse(
    val lists: List<ListSummary>
)

@Serializable
data class ListDetail(
    val id: String,
    val title: String,
    val items: List<ListItemDto>,
    val updatedAt: String
)

@Serializable
sealed class ListItemDto {
    abstract val id: String
    abstract val kind: String
    abstract val name: String
    abstract val qty: Double
    abstract val checked: Boolean
    abstract val updatedAt: String
}

@Serializable
data class ManualListItem(
    override val id: String,
    override val kind: String = "manual",
    override val name: String,
    override val qty: Double,
    override val checked: Boolean,
    override val updatedAt: String,
    val note: String? = null
) : ListItemDto()

@Serializable
data class CatalogListItem(
    override val id: String,
    override val kind: String = "catalog",
    override val name: String,
    override val qty: Double,
    override val checked: Boolean,
    override val updatedAt: String,
    val note: String? = null,
    val thumbnail: String? = null,
    val price: Double? = null,
    val unitSize: Double? = null,
    val unitFormat: String? = null,
    val unitPrice: Double? = null,
    val isApproxSize: Boolean = false,
    val source: String = "mercadona",
    val sourceProductId: String
) : ListItemDto()

@Serializable
data class CompleteListRequest(
    val checkedItemIds: List<String>
)

@Serializable
data class CompleteListResponse(
    val id: String,
    val status: String,
    val items: List<ListItemDto>,
    val updatedAt: String
)

@Serializable
data class UpdateItemRequest(
    val name: String? = null,
    val qty: Int? = null,
    val checked: Boolean? = null,
    val note: String? = null
)

// ============================================================================
// ERROR DTOS
// ============================================================================

@Serializable
data class AppError(
    val error: String
)

@Serializable
data class ValidationError(
    val error: String,
    val details: List<Map<String, String>>
)

// ============================================================================
// HEALTH CHECK DTOS
// ============================================================================

@Serializable
data class HealthStatus(
    val status: String
)

