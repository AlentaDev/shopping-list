package com.alentadev.shopping.feature.listdetail.data.remote

import com.alentadev.shopping.feature.listdetail.data.dto.ListDetailDto
import com.alentadev.shopping.feature.listdetail.data.dto.ListItemDto
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path

/**
 * API de Retrofit para acceso a detalles de listas
 * Endpoints de detalle de lista con items
 */
interface ListDetailApi {
    /**
     * Obtiene el detalle completo de una lista con sus items
     * @param listId ID de la lista
     * @return Detalle de la lista con items
     */
    @GET("api/lists/{id}")
    suspend fun getListDetail(
        @Path("id") listId: String
    ): ListDetailDto

    /**
     * Actualiza un item de la lista (por ejemplo, cambiar checked)
     * @param listId ID de la lista
     * @param itemId ID del item
     * @param request Body con los campos a actualizar (ej: {"checked": true})
     * @return Item actualizado
     */
    @PATCH("api/lists/{id}/items/{itemId}")
    suspend fun updateItemCheck(
        @Path("id") listId: String,
        @Path("itemId") itemId: String,
        @Body request: UpdateItemCheckRequest
    ): ListItemDto
}

/**
 * Request DTO para actualizar el estado checked de un item
 */
@Serializable
data class UpdateItemCheckRequest(
    val checked: Boolean
)

