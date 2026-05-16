package com.alentadev.shopping.feature.listdetail.ui.detail

import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ListItem

data class CategoryGroup(
    val category: String,
    val items: List<ListItem>
)

fun groupItemsByCategoryLevel1(
    items: List<ListItem>,
    fallbackLabel: String = "Sin categoría"
): List<CategoryGroup> {
    if (items.isEmpty()) return emptyList()

    val grouped = linkedMapOf<String, MutableList<ListItem>>()

    items.forEach { item ->
        val groupKey = (item as? CatalogItem)
            ?.categorySnapshot
            ?.trim()
            ?.takeIf { it.isNotBlank() }
            ?: fallbackLabel

        grouped.getOrPut(groupKey) { mutableListOf() }.add(item)
    }

    return grouped.map { (category, groupItems) ->
        CategoryGroup(category = category, items = groupItems.toList())
    }
}
