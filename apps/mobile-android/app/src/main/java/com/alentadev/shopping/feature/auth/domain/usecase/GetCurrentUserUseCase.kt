package com.alentadev.shopping.feature.auth.domain.usecase

import com.alentadev.shopping.feature.auth.domain.entity.User
import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository

/**
 * Caso de uso para obtener usuario actual autenticado.
 * Valida que hay sesión activa y retorna el usuario.
 *
 * Responsabilidades:
 * - Obtener sesión actual del repositorio
 * - Validar que usuario está autenticado
 * - Retornar datos de usuario
 */
class GetCurrentUserUseCase(
    private val authRepository: AuthRepository
) {
    suspend fun execute(): User {
        val session = authRepository.getCurrentSession()
        return session.user
    }
}

