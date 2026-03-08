package com.alentadev.shopping.feature.listdetail.data.local

internal fun resolveCheckedState(remoteChecked: Boolean, pendingChecked: Boolean?): Boolean {
    return pendingChecked ?: remoteChecked
}
