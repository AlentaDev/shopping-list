package com.alentadev.shopping.feature.listdetail.data.dto

import kotlinx.serialization.Serializable

@Serializable
data class CompleteListRequest(
    val checkedItemIds: List<String>
)
