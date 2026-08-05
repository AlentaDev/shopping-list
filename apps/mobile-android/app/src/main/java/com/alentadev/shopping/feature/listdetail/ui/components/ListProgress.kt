package com.alentadev.shopping.feature.listdetail.ui.components

import com.alentadev.shopping.feature.listdetail.domain.entity.ListItem

internal data class ListProgress(
    val completed: Int,
    val total: Int
) {
    val fraction: Float = if (total == 0) 0f else completed.toFloat() / total
}

internal fun calculateListProgress(items: List<ListItem>): ListProgress =
    ListProgress(
        completed = items.count { it.checked },
        total = items.size
    )
