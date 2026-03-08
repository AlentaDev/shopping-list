package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import javax.inject.Inject

sealed interface CompleteListResult {
    data object Success : CompleteListResult
    data object Offline : CompleteListResult
    data object NoConnection : CompleteListResult
    data object InvalidTransition : CompleteListResult
    data object Unauthorized : CompleteListResult
    data object Forbidden : CompleteListResult
    data object NotFound : CompleteListResult
    data object ServerError : CompleteListResult
}

class CompleteListUseCase @Inject constructor(
    private val repository: ListDetailRepository
) {
    suspend operator fun invoke(listId: String, checkedItemIds: List<String>): CompleteListResult {
        val normalizedListId = listId.trim()
        require(normalizedListId.isNotBlank()) { "El ID de la lista no puede estar vacío" }

        val normalizedCheckedItemIds = checkedItemIds.map { it.trim() }
        require(normalizedCheckedItemIds.none { it.isBlank() }) { "Los IDs de items marcados no pueden estar vacíos" }

        return repository.completeList(normalizedListId, normalizedCheckedItemIds.distinct())
    }
}
