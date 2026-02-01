package com.alentadev.shopping.feature.auth.domain.usecase

import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository

/**
 * Caso de uso para cerrar sesión de usuario.
 * Limpia datos de sesión local y remota.
 *
 * Responsabilidades:
 * - Delegar al repositorio el cierre de sesión
 * - Garantizar que datos sensibles se limpian
 */
class LogoutUseCase(
    private val authRepository: AuthRepository
) {
    suspend fun execute() {
        authRepository.logout()
    }
}

