package com.alentadev.shopping.feature.auth.data.mapper

import com.alentadev.shopping.feature.auth.data.dto.PublicUserDto
import com.alentadev.shopping.feature.auth.domain.entity.User

/**
 * Mapper para convertir DTOs de autenticación a entidades de dominio
 */
object AuthMapper {

    /**
     * Convierte DTO de usuario público a entidad de dominio
     */
    fun PublicUserDto.toDomain(): User = User(
        id = this.id,
        name = this.name,
        email = this.email,
        postalCode = this.postalCode
    )

    /**
     * Convierte entidad de usuario a DTO de usuario público
     */
    fun User.toDto(): PublicUserDto = PublicUserDto(
        id = this.id,
        name = this.name,
        email = this.email,
        postalCode = this.postalCode
    )
}

