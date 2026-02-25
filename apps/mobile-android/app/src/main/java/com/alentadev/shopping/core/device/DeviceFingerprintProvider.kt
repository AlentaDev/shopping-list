package com.alentadev.shopping.core.device

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.provider.Settings.*
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Genera un fingerprint único del dispositivo
 * Basado en ANDROID_ID que es persistente entre reinstalaciones
 */
@Singleton
class DeviceFingerprintProvider @Inject constructor(
    @param:ApplicationContext private val context: Context
) {

    @SuppressLint("HardwareIds")
    fun getFingerprint(): String {
        val androidId = Secure.getString(
            context.contentResolver,
            Secure.ANDROID_ID
        ) ?: "unknown"

        return "$androidId-${Build.MODEL}".lowercase()
    }
}

