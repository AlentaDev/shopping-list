package com.alentadev.shopping.feature.auth.domain.session

import com.alentadev.shopping.feature.auth.domain.usecase.WarmUpListsCacheUseCase
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionWarmUpOrchestrator @Inject constructor(
    private val warmUpListsCacheUseCase: WarmUpListsCacheUseCase,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    private val scope = CoroutineScope(SupervisorJob() + dispatcher)
    private var warmUpJob: kotlinx.coroutines.Job? = null

    fun startWarmUp() {
        warmUpJob?.cancel()
        warmUpJob = scope.launch {
            runCatching {
                warmUpListsCacheUseCase.execute()
            }
        }
    }

    fun cancelWarmUp() {
        warmUpJob?.cancel()
        warmUpJob = null
    }

    fun clear() {
        cancelWarmUp()
        scope.cancel()
    }
}
