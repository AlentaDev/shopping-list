package com.alentadev.shopping.core.data.network

import com.alentadev.shopping.core.network.ConnectivityGate
import javax.inject.Inject

enum class DataSource {
    REMOTE,
    CACHE
}

sealed interface OfflineFirstResult<out T> {
    data class Success<T>(
        val data: T,
        val source: DataSource
    ) : OfflineFirstResult<T>

    data class Error(
        val throwable: Throwable,
        val source: DataSource
    ) : OfflineFirstResult<Nothing>
}

class OfflineFirstExecutor @Inject constructor() {
    suspend fun <T> execute(
        connectivityGate: ConnectivityGate,
        fetchRemote: suspend () -> T,
        saveRemote: suspend (T) -> Unit,
        readLocal: suspend () -> T
    ): OfflineFirstResult<T> {
        return execute(
            isOnlineNow = connectivityGate::isOnline,
            fetchRemote = fetchRemote,
            saveRemote = saveRemote,
            readLocal = readLocal
        )
    }

    suspend fun <T> execute(
        isOnlineNow: () -> Boolean,
        fetchRemote: suspend () -> T,
        saveRemote: suspend (T) -> Unit,
        readLocal: suspend () -> T
    ): OfflineFirstResult<T> {
        return if (isOnlineNow()) {
            runRemoteFlow(fetchRemote, saveRemote, readLocal)
        } else {
            runLocalFlow(readLocal)
        }
    }

    private suspend fun <T> runRemoteFlow(
        fetchRemote: suspend () -> T,
        saveRemote: suspend (T) -> Unit,
        readLocal: suspend () -> T
    ): OfflineFirstResult<T> {
        return try {
            val remoteData = fetchRemote()
            saveRemote(remoteData)
            OfflineFirstResult.Success(remoteData, DataSource.REMOTE)
        } catch (_: Throwable) {
            runLocalFlow(readLocal)
        }
    }

    private suspend fun <T> runLocalFlow(
        readLocal: suspend () -> T
    ): OfflineFirstResult<T> {
        return try {
            val localData = readLocal()
            OfflineFirstResult.Success(localData, DataSource.CACHE)
        } catch (error: Throwable) {
            OfflineFirstResult.Error(error, DataSource.CACHE)
        }
    }
}
