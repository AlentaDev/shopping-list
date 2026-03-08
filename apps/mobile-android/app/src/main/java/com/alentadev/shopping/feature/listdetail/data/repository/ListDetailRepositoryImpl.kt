package com.alentadev.shopping.feature.listdetail.data.repository

import com.alentadev.shopping.core.data.network.OfflineFirstExecutor
import com.alentadev.shopping.core.data.network.OfflineFirstResult
import com.alentadev.shopping.core.network.ConnectivityGate
import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import com.alentadev.shopping.feature.listdetail.data.remote.ListDetailRemoteDataSource
import com.alentadev.shopping.feature.listdetail.data.local.ListDetailLocalDataSource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.onStart
import javax.inject.Inject

/**
 * Implementación de ListDetailRepository
 * Combina remote + local con estrategia offline-first
 * Prioridad: servidor primero, fallback a caché local en caso de error
 */
class ListDetailRepositoryImpl @Inject constructor(
    private val remoteDataSource: ListDetailRemoteDataSource,
    private val localDataSource: ListDetailLocalDataSource,
    private val offlineFirstExecutor: OfflineFirstExecutor,
    private val connectivityGate: ConnectivityGate
) : ListDetailRepository {

    /**
     * Obtiene el detalle de una lista como Flow (reactivo)
     * Estrategia:
     * 1. Intenta obtener del servidor
     * 2. Guarda en caché local
     * 3. Si falla, emite el caché local (si existe)
     * 4. Si no hay caché, propaga el error
     *
     * @param listId ID de la lista
     * @return Flow<ListDetail> con detalle de la lista y items
     */
    override fun getListDetail(listId: String): Flow<ListDetail> {
        return localDataSource.getListDetailFlow(listId)
            .filterNotNull()
            .onStart {
                when (
                    offlineFirstExecutor.execute(
                        connectivityGate = connectivityGate,
                        fetchRemote = { remoteDataSource.getListDetail(listId) },
                        saveRemote = { remoteDetail -> localDataSource.saveListDetail(remoteDetail) },
                        readLocal = {
                            localDataSource.getListDetail(listId)
                                ?: throw NoSuchElementException("Lista no encontrada en caché: $listId")
                        }
                    )
                ) {
                    is OfflineFirstResult.Success -> Unit
                    is OfflineFirstResult.Error -> Unit
                }
            }
    }


    override fun getCachedListDetail(listId: String): Flow<ListDetail> {
        return localDataSource.getListDetailFlow(listId)
            .filterNotNull()
    }

    override suspend fun hasCachedListDetail(listId: String): Boolean {
        return localDataSource.getListDetail(listId) != null
    }

    override suspend fun getCachedSnapshotTimestamp(listId: String): Long? {
        return localDataSource.getCachedSnapshotTimestamp(listId)
    }

    override suspend fun getCachedListUpdatedAt(listId: String): String? {
        return localDataSource.getCachedListUpdatedAt(listId)
    }

    override suspend fun getRemoteListUpdatedAt(listId: String): String {
        return remoteDataSource.getListUpdatedAt(listId)
    }

    /**
     * Actualiza el estado checked de un item de forma local (offline-first)
     * No envía cambios al backend (será sincronizado en fase 5)
     *
     * @param listId ID de la lista
     * @param itemId ID del item
     * @param checked Nuevo estado
     */
    override suspend fun updateItemChecked(listId: String, itemId: String, checked: Boolean) {
        // Validar que la lista existe localmente
        val listDetail = localDataSource.getListDetail(listId)
            ?: throw IllegalArgumentException("Lista no encontrada: $listId")

        // Validar que el item existe en la lista
        val itemExists = listDetail.items.any { it.id == itemId }
        if (!itemExists) {
            throw IllegalArgumentException("Item no encontrado: $itemId en lista: $listId")
        }

        // Actualizar localmente (sin enviar al servidor)
        localDataSource.updateItemChecked(itemId, checked)
    }

    /**
     * Sincroniza el estado checked de un item con el servidor
     *
     * @param listId ID de la lista
     * @param itemId ID del item
     * @param checked Estado del check
     * @throws Exception si hay error de red o servidor
     */
    override suspend fun syncItemCheck(listId: String, itemId: String, checked: Boolean) {
        remoteDataSource.updateItemCheck(listId, itemId, checked)
    }

    override suspend fun enqueuePendingCheckOperation(
        listId: String,
        itemId: String,
        checked: Boolean,
        localUpdatedAt: Long
    ) {
        localDataSource.enqueuePendingCheckOperation(listId, itemId, checked, localUpdatedAt)
    }

    override suspend fun markCheckOperationFailedPermanent(
        listId: String,
        itemId: String,
        checked: Boolean,
        localUpdatedAt: Long
    ) {
        localDataSource.markPendingCheckFailedPermanent(listId, itemId, checked, localUpdatedAt)
    }

    /**
     * Refresca el detalle de la lista desde el servidor
     * Obtiene datos frescos y actualiza el caché local
     *
     * @param listId ID de la lista
     * @throws Exception si hay error de red o servidor
     */
    override suspend fun refreshListDetail(listId: String) {
        // Obtiene del servidor (sin fallback local)
        val remoteDetail = remoteDataSource.getListDetail(listId)
        // Guarda en local para caché
        localDataSource.saveListDetail(remoteDetail)
    }
}

