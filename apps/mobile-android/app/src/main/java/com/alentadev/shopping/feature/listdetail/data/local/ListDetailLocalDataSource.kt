package com.alentadev.shopping.feature.listdetail.data.local

import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ManualItem
import com.alentadev.shopping.core.data.database.entity.ListEntity
import com.alentadev.shopping.core.data.database.entity.ItemEntity
import com.alentadev.shopping.core.data.database.dao.ListEntityDao
import com.alentadev.shopping.core.data.database.dao.ItemEntityDao
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import javax.inject.Inject

/**
 * Data source local para acceso a detalles de listas y items en Room
 * Se usa para offline-first: caché local de listas y sus items
 */
class ListDetailLocalDataSource @Inject constructor(
    private val listDao: ListEntityDao,
    private val itemDao: ItemEntityDao
) {

    /**
     * Obtiene el detalle completo de una lista (lista + items) en tiempo real
     * Combina datos de listas e items para dar una vista unificada
     * @param listId ID de la lista
     * @return Flow de ListDetail
     */
    fun getListDetailFlow(listId: String): Flow<ListDetail?> {
        return combine(
            listDao.getListByIdFlow(listId),
            itemDao.getItemsByListIdFlow(listId)
        ) { list, items ->
            if (list == null) {
                null
            } else {
                list.toDomain(items)
            }
        }
    }

    /**
     * Obtiene el detalle completo de una lista (suspend, una sola vez)
     * @param listId ID de la lista
     * @return ListDetail o null si no existe
     */
    suspend fun getListDetail(listId: String): ListDetail? {
        val list = listDao.getListById(listId) ?: return null
        val items = itemDao.getItemsByListId(listId)
        return list.toDomain(items)
    }

    /**
     * Guarda una lista completa (lista + items) localmente
     * Inserta o reemplaza la lista y sus items
     * @param listDetail ListDetail con items
     */
    suspend fun saveListDetail(listDetail: ListDetail) {
        // Guardar lista
        val listEntity = ListEntity(
            id = listDetail.id,
            title = listDetail.title,
            status = "ACTIVE", // Asumimos ACTIVE para el detalle
            updatedAt = listDetail.updatedAt,
            itemCount = listDetail.items.size,
            syncedAt = System.currentTimeMillis()
        )
        listDao.insert(listEntity)

        // Guardar items
        val itemEntities = listDetail.items.map { item ->
            ItemEntity(
                id = item.id,
                listId = listDetail.id,
                kind = item.kind.name.lowercase(),
                name = item.name,
                qty = item.qty,
                checked = item.checked,
                note = (item as? ManualItem)?.note,
                updatedAt = item.updatedAt,
                thumbnail = (item as? CatalogItem)?.thumbnail,
                price = (item as? CatalogItem)?.price,
                source = (item as? CatalogItem)?.source,
                sourceProductId = (item as? CatalogItem)?.sourceProductId,
                unitSize = (item as? CatalogItem)?.unitSize,
                unitFormat = (item as? CatalogItem)?.unitFormat,
                unitPrice = (item as? CatalogItem)?.unitPrice,
                isApproxSize = (item as? CatalogItem)?.isApproxSize ?: false,
                syncedAt = System.currentTimeMillis()
            )
        }
        itemDao.insertAll(itemEntities)
    }

    /**
     * Actualiza el estado checked de un item localmente
     * @param itemId ID del item
     * @param checked Nuevo estado
     */
    suspend fun updateItemChecked(itemId: String, checked: Boolean) {
        android.util.Log.d("LocalDataSource", "💾 Actualizando en Room - itemId: $itemId, checked: $checked")
        itemDao.updateCheckStatus(itemId, checked)
        android.util.Log.d("LocalDataSource", "✅ Room actualizado correctamente")
    }

    /**
     * Elimina todos los items de una lista localmente
     * @param listId ID de la lista
     */
    suspend fun deleteListItems(listId: String) {
        itemDao.deleteByListId(listId)
    }

    /**
     * Elimina la lista y todos sus items
     * @param listId ID de la lista
     */
    suspend fun deleteListDetail(listId: String) {
        deleteListItems(listId)
        listDao.deleteById(listId)
    }

    // Mappers entity ↔ domain

    private fun ListEntity.toDomain(items: List<ItemEntity>): ListDetail {
        return ListDetail(
            id = id,
            title = title,
            items = items.map { it.toDomain() },
            updatedAt = updatedAt
        )
    }

    private fun ItemEntity.toDomain(): com.alentadev.shopping.feature.listdetail.domain.entity.ListItem {
        return when (kind.lowercase()) {
            "catalog" -> CatalogItem(
                id = id,
                name = name,
                qty = qty,
                checked = checked,
                updatedAt = updatedAt,
                note = note,
                thumbnail = thumbnail,
                price = price,
                unitSize = unitSize,
                unitFormat = unitFormat,
                unitPrice = unitPrice,
                isApproxSize = isApproxSize,
                source = source ?: "mercadona",
                sourceProductId = sourceProductId ?: ""
            )
            else -> ManualItem(
                id = id,
                name = name,
                qty = qty,
                checked = checked,
                updatedAt = updatedAt,
                note = note
            )
        }
    }
}


