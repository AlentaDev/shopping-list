package com.alentadev.shopping.feature.lists.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

/**
 * DAO para acceso a la tabla de listas en Room
 * Queries para obtener, insertar y actualizar listas locales
 */
@Dao
interface ListDao {

    /**
     * Obtiene todas las listas activas guardadas en local
     * Ordenadas por updatedAt descendente (más recientes primero)
     * @return Flow de lista de listas activas
     */
    @Query("SELECT * FROM lists WHERE status = 'ACTIVE' ORDER BY updatedAt DESC")
    fun getActiveListsFlow(): Flow<List<ListEntity>>

    /**
     * Obtiene una lista específica por ID
     * @param listId ID de la lista
     * @return ListEntity o null si no existe
     */
    @Query("SELECT * FROM lists WHERE id = :listId")
    suspend fun getListById(listId: String): ListEntity?

    /**
     * Inserta o reemplaza una lista
     * Si ya existe una con el mismo ID, la reemplaza
     * @param list ListEntity a insertar
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertList(list: ListEntity)

    /**
     * Inserta o reemplaza múltiples listas (para batch updates)
     * @param lists Lista de ListEntity a insertar
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLists(lists: List<ListEntity>)

    /**
     * Elimina una lista por ID
     * @param listId ID de la lista a eliminar
     */
    @Query("DELETE FROM lists WHERE id = :listId")
    suspend fun deleteList(listId: String)

    /**
     * Elimina todas las listas
     * Útil para logout
     */
    @Query("DELETE FROM lists")
    suspend fun deleteAll()
}

