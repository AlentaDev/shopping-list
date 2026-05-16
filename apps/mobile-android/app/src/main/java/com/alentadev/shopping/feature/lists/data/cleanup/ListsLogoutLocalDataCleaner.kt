package com.alentadev.shopping.feature.lists.data.cleanup

import com.alentadev.shopping.core.session.LogoutLocalDataCleaner
import com.alentadev.shopping.feature.lists.data.local.ListsLocalDataSource
import javax.inject.Inject

class ListsLogoutLocalDataCleaner @Inject constructor(
    private val listsLocalDataSource: ListsLocalDataSource
) : LogoutLocalDataCleaner {
    override suspend fun clear() {
        listsLocalDataSource.deleteAll()
    }
}
