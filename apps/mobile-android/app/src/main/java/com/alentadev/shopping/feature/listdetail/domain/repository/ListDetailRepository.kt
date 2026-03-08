package com.alentadev.shopping.feature.listdetail.domain.repository

import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import kotlinx.coroutines.flow.Flow

/**
 * Repositorio de detalle de lista (interface del Domain Layer)
 * Define el contrato para acceder a los detalles de una lista y sus items
 *
 * Sigue el patrón Repository de Clean Architecture:
 * - Domain Layer define la interface
 * - Data Layer proporciona la implementación
 */
interface ListDetailRepository {
    /**
     * Obtiene el detalle completo de una lista por su ID
     *
     * @param listId ID de la lista
     * @return Flow con el detalle de la lista (emite cambios si hay actualizaciones)
     * @throws Exception si la lista no existe o hay un error de red/base de datos
     */
    fun getListDetail(listId: String): Flow<ListDetail>

    /**
     * Obtiene el detalle de una lista desde caché local (sin llamadas remotas)
     */
    fun getCachedListDetail(listId: String): Flow<ListDetail>

    /**
     * Verifica si existe detalle cacheado en Room para una lista.
     */
    suspend fun hasCachedListDetail(listId: String): Boolean

    /**
     * Timestamp local del snapshot en caché (epoch millis), o null si no existe.
     */
    suspend fun getCachedSnapshotTimestamp(listId: String): Long?

    /**
     * Timestamp de negocio local (`updatedAt` ISO-8601), o null si no existe snapshot.
     */
    suspend fun getCachedListUpdatedAt(listId: String): String?

    /**
     * Timestamp de negocio remoto (`updatedAt` ISO-8601) obtenido del servidor.
     */
    suspend fun getRemoteListUpdatedAt(listId: String): String

    /**
     * Actualiza el estado checked de un item de forma local (offline-first)
     *
     * @param listId ID de la lista
     * @param itemId ID del item a actualizar
     * @param checked Nuevo estado de checked
     * @throws Exception si el item no existe o hay un error
     */
    suspend fun updateItemChecked(listId: String, itemId: String, checked: Boolean)

    /**
     * Sincroniza el estado checked de un item con el servidor
     *
     * @param listId ID de la lista
     * @param itemId ID del item a sincronizar
     * @param checked Estado del check a sincronizar
     * @throws Exception si hay error de red o servidor
     */
    suspend fun syncItemCheck(listId: String, itemId: String, checked: Boolean)

    /**
     * Encola (colapsado por listId+itemId) una operación pendiente de sincronización.
     */
    suspend fun enqueuePendingCheckOperation(
        listId: String,
        itemId: String,
        checked: Boolean,
        localUpdatedAt: Long
    )

    /**
     * Registra una operación como fallo permanente (403/404).
     */
    suspend fun markCheckOperationFailedPermanent(
        listId: String,
        itemId: String,
        checked: Boolean,
        localUpdatedAt: Long
    )

    /**
     * Refresca el detalle de la lista desde el servidor
     *
     * @param listId ID de la lista
     * @throws Exception si hay error de red o servidor
     */
    suspend fun refreshListDetail(listId: String)
}
