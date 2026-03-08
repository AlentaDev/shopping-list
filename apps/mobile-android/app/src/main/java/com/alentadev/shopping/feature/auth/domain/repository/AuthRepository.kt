package com.alentadev.shopping.feature.auth.domain.repository

import com.alentadev.shopping.feature.auth.domain.entity.Session
import kotlinx.coroutines.flow.Flow

/**
 * Contrato del repositorio de autenticación.
 */
interface AuthRepository {
    suspend fun login(email: String, password: String): Session

    suspend fun logout()

    suspend fun getCurrentSession(): Session

    fun observeSession(): Flow<Session?>
}
