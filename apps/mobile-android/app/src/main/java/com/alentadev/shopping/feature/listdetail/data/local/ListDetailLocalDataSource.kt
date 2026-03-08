package com.alentadev.shopping.feature.listdetail.data.local

import com.alentadev.shopping.core.data.database.dao.ItemEntityDao
import com.alentadev.shopping.core.data.database.dao.ListEntityDao
import com.alentadev.shopping.core.data.database.dao.PendingSyncDao
import com.alentadev.shopping.core.data.database.entity.ItemEntity
import com.alentadev.shopping.core.data.database.entity.ListEntity
import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import com.alentadev.shopping.feature.listdetail.domain.entity.ManualItem
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import javax.inject.Inject

class ListDetailLocalDataSource @Inject constructor(
    private val listDao: ListEntityDao,
    private val itemDao: ItemEntityDao,
    private val pendingSyncDao: PendingSyncDao
) {

    fun getListDetailFlow(listId: String): Flow<ListDetail?> {
        return combine(
            listDao.getListByIdFlow(listId),
            itemDao.getItemsByListIdFlow(listId)
        ) { list, items ->
            if (list == null) null else list.toDomain(items)
        }
    }

    suspend fun getListDetail(listId: String): ListDetail? {
        val list = listDao.getListById(listId) ?: return null
        val items = itemDao.getItemsByListId(listId)
        return list.toDomain(items)
    }

    suspend fun getCachedSnapshotTimestamp(listId: String): Long? {
        return listDao.getListById(listId)?.syncedAt
    }

    suspend fun getCachedListUpdatedAt(listId: String): String? {
        return listDao.getListById(listId)?.updatedAt
    }

    suspend fun saveListDetail(listDetail: ListDetail) {
        val listEntity = ListEntity(
            id = listDetail.id,
            title = listDetail.title,
            status = "ACTIVE",
            updatedAt = listDetail.updatedAt,
            itemCount = listDetail.items.size,
            syncedAt = System.currentTimeMillis()
        )
        listDao.insert(listEntity)

        val itemEntities = listDetail.items.map { item ->
            val pendingChecked = pendingSyncDao.getPendingCheckedState(listDetail.id, item.id)
            ItemEntity(
                id = item.id,
                listId = listDetail.id,
                kind = item.kind.name.lowercase(),
                name = item.name,
                qty = item.qty,
                checked = resolveCheckedState(item.checked, pendingChecked),
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

    suspend fun updateItemChecked(itemId: String, checked: Boolean) {
        itemDao.updateCheckStatus(itemId, checked)
    }

    suspend fun enqueuePendingCheckOperation(listId: String, itemId: String, checked: Boolean, localUpdatedAt: Long) {
        pendingSyncDao.upsertCollapsed(listId, itemId, checked, localUpdatedAt)
    }

    suspend fun markPendingCheckFailedPermanent(listId: String, itemId: String, checked: Boolean, localUpdatedAt: Long) {
        pendingSyncDao.upsertCollapsed(listId, itemId, checked, localUpdatedAt)
        val operationId = pendingSyncDao
            .getPendingOrderedByLocalUpdatedAt()
            .firstOrNull { it.listId == listId && it.itemId == itemId }
            ?.operationId
            ?: return
        pendingSyncDao.markFailedPermanent(operationId)
    }

    suspend fun deleteListItems(listId: String) {
        itemDao.deleteByListId(listId)
    }

    suspend fun deleteListDetail(listId: String) {
        deleteListItems(listId)
        listDao.deleteById(listId)
    }

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
