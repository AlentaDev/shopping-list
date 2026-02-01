package com.alentadev.shopping.feature.auth.data.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Request para login
 */
@Serializable
data class LoginRequest(
    @SerialName("email")
    val email: String,

    @SerialName("password")
    val password: String,

    @SerialName("fingerprint")
    val fingerprint: String  // Generado dinámicamente por DeviceFingerprintProvider
)

/**
 * Response del servidor con usuario autenticado
 */
@Serializable
data class LoginResponse(
    @SerialName("user")
    val user: PublicUserDto
)

/**
 * Datos públicos del usuario
 */
@Serializable
data class PublicUserDto(
    @SerialName("id")
    val id: String,

    @SerialName("name")
    val name: String,

    @SerialName("email")
    val email: String,

    @SerialName("postalCode")
    val postalCode: String
)

/**
 * Response generica de ok
 */
@Serializable
data class OkResponse(
    @SerialName("ok")
    val ok: Boolean = true
)

