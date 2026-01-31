package com.alentadev.shopping.network

import kotlinx.serialization.Serializable
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val token: String,
    val user: User
)

@Serializable
data class User(
    val id: String,
    val email: String,
    val name: String? = null
)

interface ApiService {
    @GET("/health")
    suspend fun getHealth(): Response<Map<String, String>>

    @POST("/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("/api/shopping-lists")
    suspend fun getShoppingLists(): Response<List<Any>>
}



