package com.alentadev.shopping.core.network.di

import android.content.Context
import com.alentadev.shopping.BuildConfig
import com.alentadev.shopping.core.network.ApiService
import com.alentadev.shopping.core.network.DebugInterceptor
import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.core.network.PersistentCookieJar
import com.alentadev.shopping.core.network.RetryInterceptor
import com.alentadev.shopping.core.network.TokenAuthenticator
import com.alentadev.shopping.feature.auth.data.remote.AuthApi
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Singleton
    @Provides
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    @Singleton
    @Provides
    fun providePersistentCookieJar(
        @ApplicationContext context: Context
    ): PersistentCookieJar = PersistentCookieJar(context)

    @Singleton
    @Provides
    fun provideHttpLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor { message ->
            android.util.Log.d("RetrofitClient", message)
        }.apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
    }

    @Singleton
    @Provides
    fun provideDebugInterceptor(): DebugInterceptor = DebugInterceptor()

    @Singleton
    @Provides
    fun provideRetryInterceptor(): RetryInterceptor = RetryInterceptor()

    @Singleton
    @Provides
    fun provideOkHttpClient(
        retryInterceptor: RetryInterceptor,
        debugInterceptor: DebugInterceptor,
        loggingInterceptor: HttpLoggingInterceptor,
        cookieJar: PersistentCookieJar,
        networkMonitor: NetworkMonitor,
        retrofit: dagger.Lazy<Retrofit>  // Lazy para evitar ciclo
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(retryInterceptor)
            .addInterceptor(debugInterceptor)
            .addInterceptor(loggingInterceptor)
            .cookieJar(cookieJar)
            .authenticator(TokenAuthenticator(cookieJar, networkMonitor) {
                // Provider lazy de AuthApi
                retrofit.get().create(AuthApi::class.java)
            })
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Singleton
    @Provides
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        json: Json
    ): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Singleton
    @Provides
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }

    @Singleton
    @Provides
    fun provideAuthApi(retrofit: Retrofit): AuthApi {
        return retrofit.create(AuthApi::class.java)
    }
}
