package com.alentadev.shopping.feature.lists.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Entidad de Room para guardar una lista en local (snapshot)
 * Se usa para offline-first: caching local de listas activas
 */
@Entity(tableName = "lists")
data class ListEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val status: String,  // "ACTIVE", "DRAFT", "COMPLETED"
    val updatedAt: Long,
    val itemCount: Int = 0,
    val syncedAt: Long = System.currentTimeMillis()  // Timestamp del último sync
)

