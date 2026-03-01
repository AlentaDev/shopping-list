package com.alentadev.shopping.feature.listdetail.data.repository

import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import com.alentadev.shopping.feature.listdetail.data.remote.ListDetailRemoteDataSource
import com.alentadev.shopping.feature.listdetail.data.local.ListDetailLocalDataSource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
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
    private val localDataSource: ListDetailLocalDataSource
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
                // Intenta obtener del servidor al suscribirse
                try {
                    val remoteDetail = remoteDataSource.getListDetail(listId)
                    // Guarda en caché local
                    localDataSource.saveListDetail(remoteDetail)
                    // El Flow emitirá el valor cacheado (ya guardado)
                } catch (e: Exception) {
                    // Si falla, el Flow emite lo que tenga en caché
                    // Si no hay caché, el Flow emite null y aquí no hace nada
                }
            }
            .catch { exception ->
                // Si hay error downstream en el Flow (ej: problema con Room)
                // Propagar el error
                throw exception
            }
    }


    override fun getCachedListDetail(listId: String): Flow<ListDetail> {
        return localDataSource.getListDetailFlow(listId)
            .filterNotNull()
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
        android.util.Log.d("ListDetailRepository", "🔍 Validando item - listId: $listId, itemId: $itemId")

        // Validar que la lista existe localmente
        val listDetail = localDataSource.getListDetail(listId)
            ?: throw IllegalArgumentException("Lista no encontrada: $listId")

        android.util.Log.d("ListDetailRepository", "✅ Lista encontrada: ${listDetail.title}")

        // Validar que el item existe en la lista
        val itemExists = listDetail.items.any { it.id == itemId }
        if (!itemExists) {
            android.util.Log.e("ListDetailRepository", "❌ Item no encontrado en lista")
            throw IllegalArgumentException("Item no encontrado: $itemId en lista: $listId")
        }

        android.util.Log.d("ListDetailRepository", "💾 Guardando en Room - itemId: $itemId, checked: $checked")
        // Actualizar localmente (sin enviar al servidor)
        localDataSource.updateItemChecked(itemId, checked)
        android.util.Log.d("ListDetailRepository", "✅ Item guardado en Room")
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
        android.util.Log.d("ListDetailRepository", "🌐 Llamando a remoteDataSource.updateItemCheck - listId: $listId, itemId: $itemId, checked: $checked")
        remoteDataSource.updateItemCheck(listId, itemId, checked)
        android.util.Log.d("ListDetailRepository", "✅ Llamada a API completada")
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



