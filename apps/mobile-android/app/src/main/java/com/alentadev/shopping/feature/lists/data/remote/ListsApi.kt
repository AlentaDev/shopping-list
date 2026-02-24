package com.alentadev.shopping.feature.lists.data.remote

import com.alentadev.shopping.feature.lists.data.dto.ListSummaryDto
import com.alentadev.shopping.feature.lists.data.dto.ListsResponseDto
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * API de Retrofit para acceso a listas
 * Endpoints de listas activas del usuario
 */
interface ListsApi {

    /**
     * Obtiene las listas activas del usuario
     * @param status Filter por status (ACTIVE, DRAFT, COMPLETED)
     * @return Lista de listas del usuario
     */
    @GET("api/lists")
    suspend fun getActiveLists(
        @Query("status") status: String = "ACTIVE"
    ): ListsResponseDto

    /**
     * Obtiene una lista específica por ID con sus items
     * @param listId ID de la lista
     * @return Detalle de la lista con items
     */
    @GET("api/lists/{id}")
    suspend fun getListDetail(
        @Path("id") listId: String
    ): ListSummaryDto
}

