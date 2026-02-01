package com.alentadev.shopping.feature.auth.data.repository

import com.alentadev.shopping.feature.auth.data.local.AuthLocalDataSource
import com.alentadev.shopping.feature.auth.data.mapper.AuthMapper.toDomain
import com.alentadev.shopping.feature.auth.data.remote.AuthRemoteDataSource
import com.alentadev.shopping.feature.auth.domain.entity.Session
import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository
import kotlinx.coroutines.flow.firstOrNull

/**
 * Implementación del repositorio de autenticación
 * Coordina entre fuentes de datos remota y local
 *
 * Estrategia: remote-first (intenta servidor, fallback a local en caso de error)
 */
class AuthRepositoryImpl(
    private val remoteDataSource: AuthRemoteDataSource,
    private val localDataSource: AuthLocalDataSource
) : AuthRepository {

    /**
     * Autentica al usuario y persiste la sesión
     *
     * Flujo:
     * 1. Valida credenciales en dominio (ya hecho en use case)
     * 2. Llama API remota (AuthRemoteDataSource.login)
     * 3. Convierte DTO a entidad de dominio
     * 4. Crea sesión y la guarda localmente (DataStore)
     * 5. Retorna sesión
     *
     * @param email Email del usuario
     * @param password Contraseña del usuario
     * @return Sesión con usuario autenticado
     * @throws IllegalArgumentException si credenciales son inválidas (401)
     * @throws Exception si hay error de red
     */
    override suspend fun login(email: String, password: String): Session {
        try {
            val response = remoteDataSource.login(email, password)
            val user = response.user.toDomain()
            val session = Session(user = user)

            localDataSource.saveSession(session)

            return session
        } catch (e: Exception) {
            if (e.message?.contains("401") == true) {
                throw IllegalArgumentException("Credenciales inválidas")
            }
            throw e
        }
    }

    /**
     * Cierra la sesión del usuario
     *
     * Flujo:
     * 1. Llama API remota para invalidar sesión en servidor
     * 2. Limpia datos locales (DataStore)
     * 3. Silencia errores (puede fallar si no hay conexión)
     */
    override suspend fun logout() {
        try {
            // Intentar logout en servidor
            remoteDataSource.logout()
        } catch (_: Exception) {
            // Ignorar fallo remoto, siempre limpiar local.
        } finally {
            // Siempre limpiar datos locales
            localDataSource.clearSession()
        }
    }

    /**
     * Obtiene la sesión actual del usuario
     *
     * Flujo:
     * 1. Intenta obtener usuario actual del servidor
     * 2. Si falla, obtiene sesión guardada localmente
     * 3. Si no hay sesión local, lanza excepción
     *
     * @return Sesión con usuario autenticado
     * @throws IllegalStateException si no hay sesión activa
     */
    override suspend fun getCurrentSession(): Session {
        return try {
            // Intentar obtener usuario actual del servidor
            val user = remoteDataSource.getCurrentUser().toDomain()
            Session(user = user)
        } catch (_: Exception) {
            // Fallback a sesión local si hay error (sin red, servidor down, etc)
            val cachedSession = localDataSource.getSession().firstOrNull()
            cachedSession ?: throw IllegalStateException("User not authenticated")
        }
    }
}
