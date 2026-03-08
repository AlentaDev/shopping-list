package com.alentadev.shopping.feature.listdetail.data.remote

import com.alentadev.shopping.feature.listdetail.data.dto.CompleteListRequest
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Path

interface CompleteListApi {
    @POST("api/lists/{id}/complete")
    suspend fun completeList(
        @Path("id") listId: String,
        @Body request: CompleteListRequest
    )
}
