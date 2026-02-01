package com.alentadev.shopping.feature.auth.domain.usecase

import com.alentadev.shopping.feature.auth.domain.entity.User
import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository
import javax.inject.Inject

/**
 * Caso de uso para obtener usuario actual autenticado.
 */
class GetCurrentUserUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend fun execute(): User {
        val session = authRepository.getCurrentSession()
        return session.user
    }
}

