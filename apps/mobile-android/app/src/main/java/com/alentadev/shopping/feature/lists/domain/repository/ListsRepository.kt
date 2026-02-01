package com.alentadev.shopping.feature.lists.domain.repository

import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList

/**
 * Interfaz del repositorio para acceso a listas
 * Define el contrato que la capa de data debe implementar
 * Abstracción del origen de datos (local/remoto)
 */
interface ListsRepository {

    /**
     * Obtiene las listas activas
     * Puede venir de caché local o servidor
     * @return Lista de ShoppingList con status ACTIVE
     * @throws Exception si hay error de persistencia
     */
    suspend fun getActiveLists(): List<ShoppingList>

    /**
     * Recarga las listas activas desde el servidor
     * Descarga datos frescos del backend
     * @return Lista de ShoppingList actualizada
     * @throws Exception si hay error de red o servidor (sin fallback local)
     */
    suspend fun refreshActiveLists(): List<ShoppingList>

    /**
     * Obtiene una lista por su ID
     * @param listId ID de la lista
     * @return ShoppingList o null si no existe
     * @throws Exception si hay error
     */
    suspend fun getListById(listId: String): ShoppingList?

    /**
     * Obtiene listas activas con metadata de origen (cache o remoto)
     * @return ActiveListsResult con flag fromCache
     */
    suspend fun getActiveListsWithSource(): com.alentadev.shopping.feature.lists.domain.entity.ActiveListsResult
}
