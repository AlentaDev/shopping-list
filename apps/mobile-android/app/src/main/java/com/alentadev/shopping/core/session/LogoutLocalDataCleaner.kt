package com.alentadev.shopping.core.session

interface LogoutLocalDataCleaner {
    suspend fun clear()
}
