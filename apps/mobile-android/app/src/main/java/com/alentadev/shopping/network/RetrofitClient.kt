package com.alentadev.shopping.network

import android.content.Context
import android.util.Log
import com.alentadev.shopping.BuildConfig
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit

private const val TAG = "RetrofitClient"

object RetrofitClient {
    private lateinit var apiService: ApiService
    private lateinit var cookieJar: PersistentCookieJar
    private var baseUrl: String = ""

    fun initialize(context: Context) {
        Log.d(TAG, "Inicializando RetrofitClient con URL base: ${BuildConfig.API_BASE_URL}")
        baseUrl = BuildConfig.API_BASE_URL
        createRetrofitClient(context)
    }

    private fun createRetrofitClient(context: Context) {
        cookieJar = PersistentCookieJar(context)

        val loggingInterceptor = HttpLoggingInterceptor { message ->
            Log.d(TAG, message)
        }.apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        // Debug interceptor personalizado para más detalle
        val debugInterceptor = DebugInterceptor()

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(debugInterceptor)  // Primero el debug
            .addInterceptor(loggingInterceptor)
            .cookieJar(cookieJar)
            .authenticator(TokenAuthenticator(cookieJar))
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        val json = Json {
            ignoreUnknownKeys = true
            isLenient = true
            coerceInputValues = true
        }

        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

        apiService = retrofit.create(ApiService::class.java)
        Log.d(TAG, "RetrofitClient inicializado correctamente con URL: $baseUrl")
    }

    fun updateBaseUrl(newUrl: String) {
        if (newUrl != baseUrl) {
            Log.d(TAG, "Actualizando URL base de '$baseUrl' a '$newUrl'")
            baseUrl = newUrl
            // Nota: Para cambiar verdaderamente el baseUrl, necesitarías reinicializar
            // Por ahora, el cambio se aplicará en la próxima inicialización
            Log.d(TAG, "URL actualizada. Se aplicará en la próxima petición.")
        }
    }

    fun getApiService(): ApiService {
        if (!::apiService.isInitialized) {
            throw IllegalStateException("RetrofitClient must be initialized first")
        }
        return apiService
    }

    fun clearCookies() {
        if (::cookieJar.isInitialized) {
            cookieJar.clear()
            Log.d(TAG, "Cookies limpiadas")
        }
    }
}

