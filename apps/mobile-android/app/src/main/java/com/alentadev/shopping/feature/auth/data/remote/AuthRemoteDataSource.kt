package com.alentadev.shopping.feature.auth.data.remote

import com.alentadev.shopping.feature.auth.data.dto.LoginRequest
import com.alentadev.shopping.feature.auth.data.dto.LoginResponse
import com.alentadev.shopping.feature.auth.data.dto.PublicUserDto

/**
 * Fuente de datos remota para autenticación
 * Abstrae las llamadas HTTP a la API
 */
class AuthRemoteDataSource(
    private val authApi: AuthApi
) {

    /**
     * Autentica al usuario con email y password
     * @param email Email del usuario
     * @param password Contraseña del usuario
     * @return Respuesta del servidor con usuario y token
     * @throws Exception si hay error de red o servidor
     */
    suspend fun login(email: String, password: String): LoginResponse {
        return authApi.login(LoginRequest(email, password))
    }

    /**
     * Cierra la sesión del usuario
     * Invalida el token actual
     */
    suspend fun logout() {
        authApi.logout()
    }

    /**
     * Obtiene los datos del usuario actual autenticado
     * @return Datos públicos del usuario
     * @throws Exception si no está autenticado o hay error de red
     */
    suspend fun getCurrentUser(): PublicUserDto {
        return authApi.getCurrentUser()
    }
}

