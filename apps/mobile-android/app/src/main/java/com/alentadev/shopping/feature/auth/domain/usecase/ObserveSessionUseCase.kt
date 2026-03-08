package com.alentadev.shopping.feature.auth.domain.usecase

import com.alentadev.shopping.feature.auth.domain.entity.Session
import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class ObserveSessionUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    fun execute(): Flow<Session?> = authRepository.observeSession()
}
