package com.alentadev.shopping.core.network

import okhttp3.HttpUrl

interface AuthCredentialProvider {
    fun hasCredentials(url: HttpUrl): Boolean
    fun buildCookieHeader(url: HttpUrl): String?
}
