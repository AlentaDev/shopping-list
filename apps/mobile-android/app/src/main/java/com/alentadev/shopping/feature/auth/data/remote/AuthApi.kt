package com.alentadev.shopping.feature.auth.data.remote

import com.alentadev.shopping.feature.auth.data.dto.LoginRequest
import com.alentadev.shopping.feature.auth.data.dto.LoginResponse
import com.alentadev.shopping.feature.auth.data.dto.PublicUserDto
import com.alentadev.shopping.feature.auth.data.dto.OkResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/**
 * API de autenticación
 * Endpoints para login, logout, refresh token y obtener usuario actual
 */
interface AuthApi {

    /**
     * Login con email y password
     * @param request Email y password del usuario
     * @return Sesión con usuario y token de acceso
     */
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    /**
     * Logout del usuario
     * Invalida la sesión actual
     */
    @POST("api/auth/logout")
    suspend fun logout(): OkResponse

    /**
     * Refresh del token de acceso
     * Se llama automáticamente en 401 por TokenAuthenticator
     * @return Nuevo token de acceso
     */
    @POST("api/auth/refresh")
    suspend fun refreshToken(): OkResponse

    /**
     * Obtener datos del usuario actual autenticado
     * @return Datos públicos del usuario
     */
    @GET("api/users/me")
    suspend fun getCurrentUser(): PublicUserDto
}
