package com.alentadev.shopping.feature.auth.domain.repository

import com.alentadev.shopping.feature.auth.domain.entity.Session
import com.alentadev.shopping.feature.auth.domain.entity.User

/**
 * Contrato del repositorio de autenticación.
 * Abstrae la capa de datos para que el dominio no conozca detalles de implementación.
 */
interface AuthRepository {
    /**
     * Autentica al usuario con email y contraseña.
     * @param email Email del usuario
     * @param password Contraseña del usuario
     * @return Session con usuario autenticado
     * @throws IllegalArgumentException si credenciales son inválidas
     * @throws Exception si hay error de red o servidor
     */
    suspend fun login(email: String, password: String): Session

    /**
     * Cierra la sesión del usuario actual.
     * Limpia datos de sesión local y remota.
     */
    suspend fun logout()

    /**
     * Obtiene la sesión actual del usuario.
     * @return Session si usuario está autenticado
     * @throws IllegalStateException si no hay sesión activa
     */
    suspend fun getCurrentSession(): Session
}

