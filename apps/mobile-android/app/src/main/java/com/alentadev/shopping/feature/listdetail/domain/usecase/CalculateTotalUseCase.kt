package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import com.alentadev.shopping.feature.listdetail.domain.entity.ListItem
import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import javax.inject.Inject

/**
 * Caso de uso: Calcular total de items marcados
 *
 * Responsabilidades:
 * - Calcular la suma total de items checked
 * - Solo incluir items con precio disponible
 * - Aplicar fórmula: precio * cantidad
 *
 * Lógica de negocio:
 * - Solo items checked (marcados como comprados)
 * - Solo items con precio disponible (price != null)
 * - Resultado en euros (sin redondeo)
 */
class CalculateTotalUseCase @Inject constructor() {
    /**
     * Ejecuta el caso de uso
     *
     * @param listDetail Detalle de la lista con items
     * @return Total en euros de los items marcados (0.0 si no hay items con precio)
     */
    operator fun invoke(listDetail: ListDetail): Double {
        return listDetail.items
            .filter { it.checked }
            .filterIsInstance<CatalogItem>()
            .mapNotNull { it.getTotalPrice() }
            .sum()
    }

    /**
     * Calcula el total para una lista específica de items
     * Útil para calcular subtotales o totales parciales
     *
     * @param items Lista de items a sumar
     * @return Total en euros (0.0 si no hay items con precio)
     */
    fun calculateForItems(items: List<ListItem>): Double {
        return items
            .filter { it.checked }
            .filterIsInstance<CatalogItem>()
            .mapNotNull { it.getTotalPrice() }
            .sum()
    }
}


