package com.alentadev.shopping.network

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.apiDataStore by preferencesDataStore(name = "api_config")

class ApiUrlManager(private val context: Context) {
    companion object {
        private val API_URL_KEY = stringPreferencesKey("api_base_url")
    }

    val apiUrlFlow: Flow<String> = context.apiDataStore.data
        .map { preferences ->
            preferences[API_URL_KEY] ?: "http://10.0.2.2:3000"
        }

    suspend fun setApiUrl(url: String) {
        context.apiDataStore.edit { preferences ->
            preferences[API_URL_KEY] = url
        }
    }

    suspend fun getApiUrl(): String {
        return apiUrlFlow.let { flow ->
            var url = "http://10.0.2.2:3000"
            flow.collect { u -> url = u }
            url
        }
    }
}

