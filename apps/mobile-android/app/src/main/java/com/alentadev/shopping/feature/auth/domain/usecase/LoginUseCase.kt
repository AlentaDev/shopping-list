package com.alentadev.shopping.feature.auth.domain.usecase

import com.alentadev.shopping.feature.auth.domain.entity.Session
import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository
import javax.inject.Inject

/**
 * Caso de uso para autenticación de usuario.
 * Valida credenciales y obtiene sesión del repositorio.
 */
class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend fun execute(email: String, password: String): Session {
        // Validar email no está vacío
        require(email.isNotBlank()) { "Email no puede estar vacío" }

        // Validar password no está vacío
        require(password.isNotBlank()) { "Contraseña no puede estar vacía" }

        // Validar formato de email básico (contiene @ y .)
        require(email.contains("@") && email.contains(".")) {
            "Email inválido"
        }

        // Delegar al repositorio
        return authRepository.login(email, password)
    }
}

