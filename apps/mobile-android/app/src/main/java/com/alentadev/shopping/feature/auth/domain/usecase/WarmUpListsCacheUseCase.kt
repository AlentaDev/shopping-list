package com.alentadev.shopping.feature.auth.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import javax.inject.Inject

/**
 * Warm-up post login para hidratar Room sin bloquear la navegación.
 *
 * Estrategia:
 * 1) Refresca resúmenes de listas activas desde servidor y los persiste localmente.
 * 2) Recorre las listas activas e intenta hidratar detalle solo cuando falta en caché.
 * 3) Si falla la hidratación de un detalle, continúa con las demás listas.
 */
class WarmUpListsCacheUseCase @Inject constructor(
    private val listsRepository: ListsRepository,
    private val listDetailRepository: ListDetailRepository
) {
    suspend fun execute() {
        val activeLists = listsRepository.refreshActiveLists()
        if (activeLists.isEmpty()) return

        activeLists.forEach { list ->
            val hasCachedDetail = listDetailRepository.hasCachedListDetail(list.id)
            if (!hasCachedDetail) {
                runCatching {
                    listDetailRepository.refreshListDetail(list.id)
                }
            }
        }
    }
}

