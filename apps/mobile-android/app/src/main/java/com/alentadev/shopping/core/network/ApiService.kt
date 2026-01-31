package com.alentadev.shopping.core.network

import com.alentadev.shopping.core.data.dto.PublicUser
import com.alentadev.shopping.core.data.dto.LoginRequest
import com.alentadev.shopping.core.data.dto.OkResponse
import com.alentadev.shopping.core.data.dto.ListListsResponse
import com.alentadev.shopping.core.data.dto.ListDetail
import com.alentadev.shopping.core.data.dto.CompleteListRequest
import com.alentadev.shopping.core.data.dto.CompleteListResponse
import com.alentadev.shopping.core.data.dto.HealthStatus
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PATCH
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {

    // ========================================================================
    // Health
    // ========================================================================

    @GET("/health")
    suspend fun getHealth(): Response<HealthStatus>

    // ========================================================================
    // Auth
    // ========================================================================

    @POST("/api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<PublicUser>

    @POST("/api/auth/logout")
    suspend fun logout(): Response<OkResponse>

    @POST("/api/auth/refresh")
    suspend fun refreshToken(): Response<OkResponse>

    @GET("/api/users/me")
    suspend fun getCurrentUser(): Response<PublicUser>

    // ========================================================================
    // Lists
    // ========================================================================

    @GET("/api/lists")
    suspend fun getShoppingLists(
        @Query("status") status: String? = null
    ): Response<ListListsResponse>

    @GET("/api/lists/{id}")
    suspend fun getListDetail(
        @Path("id") listId: String
    ): Response<ListDetail>

    @POST("/api/lists/{id}/complete")
    suspend fun completeList(
        @Path("id") listId: String,
        @Body request: CompleteListRequest
    ): Response<CompleteListResponse>

    // ========================================================================
    // Items
    // ========================================================================

    @PATCH("/api/lists/{id}/items/{itemId}")
    suspend fun updateItem(
        @Path("id") listId: String,
        @Path("itemId") itemId: String,
        @Body request: Map<String, Any>
    ): Response<Map<String, Any>>
}

