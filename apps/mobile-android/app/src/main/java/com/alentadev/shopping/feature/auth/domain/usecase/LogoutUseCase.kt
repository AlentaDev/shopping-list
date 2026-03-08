package com.alentadev.shopping.feature.auth.domain.usecase

import com.alentadev.shopping.feature.auth.domain.session.SessionWarmUpOrchestrator
import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository
import javax.inject.Inject

/**
 * Caso de uso para cerrar sesión de usuario.
 */
class LogoutUseCase @Inject constructor(
    private val authRepository: AuthRepository,
    private val sessionWarmUpOrchestrator: SessionWarmUpOrchestrator
) {
    suspend fun execute() {
        sessionWarmUpOrchestrator.cancelWarmUp()
        authRepository.logout()
    }
}
