package com.alentadev.shopping.feature.listdetail.data.remote
import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import com.alentadev.shopping.feature.listdetail.domain.entity.CatalogItem
import com.alentadev.shopping.feature.listdetail.domain.entity.ManualItem
import com.alentadev.shopping.feature.listdetail.data.dto.ListDetailDto
import com.alentadev.shopping.feature.listdetail.data.dto.ListItemDto
import javax.inject.Inject

/**
 * Data source remoto para obtener detalles de lista desde la API
 * Se comunica directamente con ListDetailApi
 */
class ListDetailRemoteDataSource @Inject constructor(
    private val listDetailApi: ListDetailApi
) {

    /**
     * Obtiene el detalle completo de una lista con sus items desde el servidor
     * @param listId ID de la lista
     * @return ListDetail con items
     * @throws Exception si hay error de red o servidor
     */
    suspend fun getListDetail(listId: String): ListDetail {
        val dto = listDetailApi.getListDetail(listId)
        return dto.toDomain()
    }

    /**
     * Actualiza el estado checked de un item en el servidor
     * @param listId ID de la lista
     * @param itemId ID del item
     * @param checked Nuevo estado de checked
     * @throws Exception si hay error de red o servidor
     */
    suspend fun updateItemCheck(listId: String, itemId: String, checked: Boolean) {
        android.util.Log.d("RemoteDataSource", "🚀 PATCH /api/lists/$listId/items/$itemId - checked: $checked")
        val request = UpdateItemCheckRequest(checked)
        val response = listDetailApi.updateItemCheck(listId, itemId, request)
        android.util.Log.d("RemoteDataSource", "✅ Respuesta recibida: ${response.id}")
    }

    /**
     * Convierte ListDetailDto a ListDetail (domain)
     * Mapea cada item según su kind (catalog o manual)
     */
    private fun ListDetailDto.toDomain(): ListDetail {
        return ListDetail(
            id = id,
            title = title,
            items = items.map { it.toDomain() },
            updatedAt = updatedAt
        )
    }

    /**
     * Convierte ListItemDto a ListItem (domain)
     * Mapea a CatalogItem o ManualItem según el kind
     */
    private fun ListItemDto.toDomain(): com.alentadev.shopping.feature.listdetail.domain.entity.ListItem {
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


