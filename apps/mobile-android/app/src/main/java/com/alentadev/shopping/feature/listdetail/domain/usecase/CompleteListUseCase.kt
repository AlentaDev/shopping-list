package com.alentadev.shopping.feature.listdetail.domain.usecase

import javax.inject.Inject

sealed interface CompleteListResult {
    data object Success : CompleteListResult
    data object Offline : CompleteListResult
    data object InvalidTransition : CompleteListResult
    data object Unauthorized : CompleteListResult
    data object Forbidden : CompleteListResult
    data object NotFound : CompleteListResult
    data object ServerError : CompleteListResult
}

interface CompleteListRepository {
    suspend fun completeList(listId: String, checkedItemIds: List<String>): CompleteListResult
}

class CompleteListUseCase @Inject constructor(
    private val repository: CompleteListRepository
) {
    suspend operator fun invoke(listId: String, checkedItemIds: List<String>): CompleteListResult {
        require(listId.isNotBlank()) { "El ID de la lista no puede estar vacío" }
        require(checkedItemIds.none { it.isBlank() }) { "Los IDs de items marcados no pueden estar vacíos" }

        return repository.completeList(listId, checkedItemIds)
    }
}
