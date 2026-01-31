package com.alentadev.shopping.core.data.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

// ============================================================================
// USER ENTITY - Snapshot del usuario autenticado
// ============================================================================

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val email: String,
    val postalCode: String,
    val syncedAt: Long = System.currentTimeMillis()
)

// ============================================================================
// LIST ENTITY - Snapshot de listas activas
// ============================================================================

@Entity(tableName = "lists")
data class ListEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val status: String, // ACTIVE, COMPLETED, DRAFT
    val updatedAt: String,
    val syncedAt: Long = System.currentTimeMillis()
)

// ============================================================================
// ITEM ENTITY - Snapshot de items de listas
// ============================================================================

@Entity(
    tableName = "items",
    foreignKeys = [
        androidx.room.ForeignKey(
            entity = ListEntity::class,
            parentColumns = ["id"],
            childColumns = ["listId"],
            onDelete = androidx.room.ForeignKey.CASCADE
        )
    ]
)
data class ItemEntity(
    @PrimaryKey
    val id: String,
    val listId: String, // FK a ListEntity
    val kind: String, // manual | catalog
    val name: String,
    val qty: Double,
    val checked: Boolean = false,
    val note: String? = null,
    val updatedAt: String,
    // Campos específicos de items de catálogo
    val thumbnail: String? = null,
    val price: Double? = null,
    val source: String? = null, // mercadona
    val sourceProductId: String? = null,
    val unitSize: Double? = null,
    val unitFormat: String? = null,
    val unitPrice: Double? = null,
    val isApproxSize: Boolean = false,
    val syncedAt: Long = System.currentTimeMillis()
)

// ============================================================================
// SYNC METADATA ENTITY - Información de sincronización
// ============================================================================

@Entity(tableName = "sync_metadata")
data class SyncMetadataEntity(
    @PrimaryKey(autoGenerate = false)
    val key: String, // ej: "last_sync_time", "lists_version"
    val value: String,
    val updatedAt: Long = System.currentTimeMillis()
)

