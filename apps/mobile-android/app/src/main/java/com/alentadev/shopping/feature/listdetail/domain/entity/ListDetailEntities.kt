package com.alentadev.shopping.feature.listdetail.domain.entity

enum class ItemKind {
    MANUAL,
    CATALOG
}

sealed class ListItem {
    abstract val id: String
    abstract val kind: ItemKind
    abstract val name: String
    abstract val qty: Double
    abstract val checked: Boolean
    abstract val updatedAt: String
}

data class ManualItem(
    override val id: String,
    override val name: String,
    override val qty: Double,
    override val checked: Boolean,
    override val updatedAt: String,
    val note: String? = null
) : ListItem() {
    override val kind: ItemKind = ItemKind.MANUAL
}

data class CatalogItem(
    override val id: String,
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
) : ListItem() {
    override val kind: ItemKind = ItemKind.CATALOG

    /**
     * Calcula el precio total del item: price * qty
     * Solo para items de catálogo con precio disponible
     */
    fun getTotalPrice(): Double? {
        return if (price != null && qty > 0) {
            price * qty
        } else {
            null
        }
    }
}

/**
 * Detalle completo de una lista con items
 */
data class ListDetail(
    val id: String,
    val title: String,
    val items: List<ListItem>,
    val updatedAt: String
) {
    /**
     * Calcula el total para items marcados como comprados
     */
    fun getCheckedItemsTotal(): Double {
        return items
            .filter { it.checked }
            .filterIsInstance<CatalogItem>()
            .mapNotNull { it.getTotalPrice() }
            .sum()
    }
}


