package com.alentadev.shopping.feature.auth.domain.entity

// Entidad de usuario del dominio (sin dependencias Android)
data class User(
    val id: String,
    val name: String,
    val email: String,
    val postalCode: String
)

// Entidad de sesión del dominio
data class Session(
    val user: User,
    val createdAt: Long = System.currentTimeMillis(),
    val isAuthenticated: Boolean = true
)

