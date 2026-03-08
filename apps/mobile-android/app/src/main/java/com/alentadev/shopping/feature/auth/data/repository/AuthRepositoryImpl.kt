package com.alentadev.shopping.feature.auth.data.repository

import com.alentadev.shopping.feature.auth.data.local.AuthLocalDataSource
import com.alentadev.shopping.feature.auth.data.mapper.AuthMapper.toDomain
import com.alentadev.shopping.feature.auth.data.remote.AuthRemoteDataSource
import com.alentadev.shopping.feature.auth.domain.entity.Session
import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull

class AuthRepositoryImpl(
    private val remoteDataSource: AuthRemoteDataSource,
    private val localDataSource: AuthLocalDataSource
) : AuthRepository {

    override suspend fun login(email: String, password: String): Session {
        try {
            val userDto = remoteDataSource.login(email, password)
            val user = userDto.toDomain()
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

    override suspend fun logout() {
        try {
            remoteDataSource.logout()
        } catch (_: Exception) {
        } finally {
            localDataSource.clearSession()
        }
    }

    override suspend fun getCurrentSession(): Session {
        return try {
            val user = remoteDataSource.getCurrentUser().toDomain()
            Session(user = user)
        } catch (_: Exception) {
            val cachedSession = localDataSource.getSession().firstOrNull()
            cachedSession ?: throw IllegalStateException("User not authenticated")
        }
    }

    override fun observeSession(): Flow<Session?> {
        return localDataSource.getSession()
    }
}
