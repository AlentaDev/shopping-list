package com.alentadev.shopping.feature.auth.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.alentadev.shopping.feature.auth.domain.entity.Session
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class AuthLocalDataSource(
    private val dataStore: DataStore<Preferences>
) {

    companion object {
        private val SESSION_KEY = stringPreferencesKey("session")
        private val USER_KEY = stringPreferencesKey("user")
        private val TOKEN_KEY = stringPreferencesKey("access_token")
    }

    suspend fun saveSession(session: Session) {
        dataStore.edit { preferences ->
            preferences[SESSION_KEY] = Json.encodeToString(session)
            preferences[USER_KEY] = Json.encodeToString(session.user)
        }
    }

    suspend fun saveAccessToken(token: String) {
        dataStore.edit { preferences ->
            preferences[TOKEN_KEY] = token
        }
    }

    fun getSession(): Flow<Session?> = dataStore.data.map { preferences ->
        val sessionJson = preferences[SESSION_KEY]
        if (sessionJson != null) {
            try {
                Json.decodeFromString<Session>(sessionJson)
            } catch (_: Exception) {
                null
            }
        } else {
            null
        }
    }

    fun getAccessToken(): Flow<String?> = dataStore.data.map { preferences ->
        preferences[TOKEN_KEY]
    }

    suspend fun clearSession() {
        dataStore.edit { preferences ->
            preferences.remove(SESSION_KEY)
            preferences.remove(USER_KEY)
            preferences.remove(TOKEN_KEY)
        }
    }
}
