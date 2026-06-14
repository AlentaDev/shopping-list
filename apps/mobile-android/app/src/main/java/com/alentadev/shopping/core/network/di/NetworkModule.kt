package com.alentadev.shopping.core.network.di

import android.content.Context
import com.alentadev.shopping.BuildConfig
import com.alentadev.shopping.core.network.ApiService
import com.alentadev.shopping.core.network.AuthRetryPolicy
import com.alentadev.shopping.core.network.ConnectivityGate
import com.alentadev.shopping.core.network.CookieClearingSessionInvalidationNotifier
import com.alentadev.shopping.core.network.DebugLogMode
import com.alentadev.shopping.core.network.DebugInterceptor
import com.alentadev.shopping.core.network.DefaultAuthRetryPolicy
import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.core.network.NetworkLoggingPolicy
import com.alentadev.shopping.core.network.PersistentCookieJar
import com.alentadev.shopping.core.network.RefreshCoordinator
import com.alentadev.shopping.core.network.RetryInterceptor
import com.alentadev.shopping.core.network.SessionInvalidationNotifier
import com.alentadev.shopping.core.network.TokenAuthenticator
import com.alentadev.shopping.core.network.resolveNetworkLoggingPolicy as resolveLoggingPolicy
import com.alentadev.shopping.feature.auth.data.local.AuthLocalDataSource
import com.alentadev.shopping.feature.auth.data.remote.AuthApi
import com.alentadev.shopping.feature.sync.application.SyncCoordinator
import dagger.Lazy
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

    internal fun resolveNetworkLoggingPolicy(
        apiBaseUrl: String,
        isDebugBuild: Boolean,
        isReleaseCapable: Boolean,
        isProductionApiTarget: Boolean
    ): NetworkLoggingPolicy = resolveLoggingPolicy(
        apiBaseUrl = apiBaseUrl,
        isDebugBuild = isDebugBuild,
        isReleaseCapable = isReleaseCapable,
        isProductionApiTarget = isProductionApiTarget
    )

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
    fun provideNetworkLoggingPolicy(): NetworkLoggingPolicy = resolveNetworkLoggingPolicy(
        apiBaseUrl = BuildConfig.API_BASE_URL,
        isDebugBuild = BuildConfig.DEBUG,
        isReleaseCapable = BuildConfig.IS_RELEASE_CAPABLE,
        isProductionApiTarget = BuildConfig.IS_PRODUCTION_API_TARGET
    )

    @Singleton
    @Provides
    fun provideHttpLoggingInterceptor(policy: NetworkLoggingPolicy): HttpLoggingInterceptor {
        return HttpLoggingInterceptor { message ->
            android.util.Log.d("RetrofitClient", message)
        }.apply {
            level = policy.httpLoggingLevel
        }
    }

    @Singleton
    @Provides
    fun provideDebugInterceptor(policy: NetworkLoggingPolicy): DebugInterceptor = DebugInterceptor(
        mode = policy.debugLogMode
    )

    @Singleton
    @Provides
    fun provideRetryInterceptor(
        connectivityGate: ConnectivityGate
    ): RetryInterceptor = RetryInterceptor(connectivityGate)

    @Singleton
    @Provides
    fun provideAuthRetryPolicy(): AuthRetryPolicy = DefaultAuthRetryPolicy()

    @Singleton
    @Provides
    fun provideConnectivityGate(
        networkMonitor: NetworkMonitor
    ): ConnectivityGate = networkMonitor

    @Singleton
    @Provides
    fun provideRefreshCoordinator(
        connectivityGate: ConnectivityGate,
        retrofit: Lazy<Retrofit>
    ): RefreshCoordinator {
        return RefreshCoordinator(connectivityGate) {
            retrofit.get().create(AuthApi::class.java)
        }
    }

    @Singleton
    @Provides
    fun provideSessionInvalidationNotifier(
        cookieJar: PersistentCookieJar,
        syncCoordinator: SyncCoordinator,
        authLocalDataSource: AuthLocalDataSource
    ): SessionInvalidationNotifier = CookieClearingSessionInvalidationNotifier(
        cookieJar = cookieJar,
        syncCoordinator = syncCoordinator,
        authLocalDataSource = authLocalDataSource
    )

    @Singleton
    @Provides
    fun provideTokenAuthenticator(
        authRetryPolicy: AuthRetryPolicy,
        refreshCoordinator: RefreshCoordinator,
        sessionInvalidationNotifier: SessionInvalidationNotifier,
        authCredentialProvider: PersistentCookieJar
    ): TokenAuthenticator {
        return TokenAuthenticator(
            authRetryPolicy = authRetryPolicy,
            refreshCoordinator = refreshCoordinator,
            sessionInvalidationNotifier = sessionInvalidationNotifier,
            authCredentialProvider = authCredentialProvider
        )
    }

    @Singleton
    @Provides
    fun provideOkHttpClient(
        retryInterceptor: RetryInterceptor,
        debugInterceptor: DebugInterceptor,
        loggingInterceptor: HttpLoggingInterceptor,
        cookieJar: PersistentCookieJar,
        tokenAuthenticator: Lazy<TokenAuthenticator>
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(retryInterceptor)
            .addInterceptor(debugInterceptor)
            .addInterceptor(loggingInterceptor)
            .cookieJar(cookieJar)
            .authenticator { route, response ->
                tokenAuthenticator.get().authenticate(route, response)
            }
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
