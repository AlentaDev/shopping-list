# 🚀 FASE 3.1: Domain Layer - Detalle de Lista

> **Fecha**: 2026-02-25  
> **Estado**: ✅ COMPLETADA

---

## 📋 Resumen

Se ha implementado la capa de dominio completa para el detalle de listas, siguiendo los principios de Clean Architecture y TDD. Esta fase incluye entidades, repositorio, casos de uso y tests unitarios exhaustivos.

---

## ✅ Archivos Implementados

### **1. ListDetailEntities.kt** (Entity) - YA EXISTÍA
**Path**: `feature/listdetail/domain/entity/ListDetailEntities.kt`

**Contenido**:
- `ItemKind` enum (CATALOG)
- `ListItem` data class (item de catalogo)
- `ListDetail` data class (detalle completo de la lista)

**Funcionalidades**:
- `ListItem.getTotalPrice()`: Calcula precio * qty
- `ListDetail.getCheckedItemsTotal()`: Suma total de items marcados

---

### **2. ListDetailRepository.kt** (Interface) - ✅ NUEVO
**Path**: `feature/listdetail/domain/repository/ListDetailRepository.kt`

**Métodos**:
```kotlin
interface ListDetailRepository {
    fun getListDetail(listId: String): Flow<ListDetail>
    suspend fun updateItemChecked(listId: String, itemId: String, checked: Boolean)
    suspend fun refreshListDetail(listId: String)
}
```

**Responsabilidad**: Contrato para la capa de datos (offline-first)

---

### **3. GetListDetailUseCase.kt** - ✅ NUEVO
**Path**: `feature/listdetail/domain/usecase/GetListDetailUseCase.kt`

**Funcionalidad**:
- Obtiene el detalle de una lista por ID
- Valida que el listId no esté vacío
- Retorna Flow<ListDetail> para actualizaciones reactivas

**Ejemplo de uso**:
```kotlin
val listDetail: Flow<ListDetail> = getListDetailUseCase("list-123")
```

**Tests**: 5 casos (✅ PASSING)
- ✅ Retorna detalle de lista desde repositorio
- ✅ Retorna detalle con múltiples items
- ✅ Lanza excepción si listId es blanco
- ✅ Lanza excepción si listId es whitespace
- ✅ Propaga excepciones del repositorio

---

### **4. CheckItemUseCase.kt** - ✅ NUEVO
**Path**: `feature/listdetail/domain/usecase/CheckItemUseCase.kt`

**Funcionalidad**:
- Marca/desmarca un item de la lista (toggle checked)
- Validaciones de listId e itemId
- Operación offline-first (no requiere conexión)

**Ejemplo de uso**:
```kotlin
checkItemUseCase("list-123", "item-456", checked = true)
```

**Tests**: 7 casos (✅ PASSING)
- ✅ Llama al repositorio con checked = true
- ✅ Llama al repositorio con checked = false
- ✅ Lanza excepción si listId es blanco
- ✅ Lanza excepción si itemId es blanco
- ✅ Lanza excepción si listId es whitespace
- ✅ Lanza excepción si itemId es whitespace
- ✅ Propaga excepciones del repositorio

---

### **5. CalculateTotalUseCase.kt** - ✅ NUEVO
**Path**: `feature/listdetail/domain/usecase/CalculateTotalUseCase.kt`

**Funcionalidad**:
- Calcula el total de items marcados
- Solo incluye items con precio disponible
- Formula: `sum(price * qty)` para checked items
- Resultado en euros sin redondeo

**Ejemplo de uso**:
```kotlin
val total: Double = calculateTotalUseCase(listDetail)
// Retorna: 12.50 (euros)
```

**Tests**: 9 casos (✅ PASSING)
- ✅ Calcula total para items marcados
- ✅ Retorna 0.0 cuando no hay items marcados
- ✅ Ignora items sin precio
- ✅ Retorna 0.0 para lista vacia
- ✅ Maneja mix de items marcados y no marcados
- ✅ Calcula total para lista especifica de items
- ✅ Maneja cantidades decimales correctamente

---

## 📊 Cobertura de Tests

### **Tests Unitarios Creados**
- `GetListDetailUseCaseTest.kt` - 5 tests ✅
- `CheckItemUseCaseTest.kt` - 7 tests ✅
- `CalculateTotalUseCaseTest.kt` - 9 tests ✅

**Total**: 21 tests unitarios

### **Escenarios Probados**
1. ✅ Validaciones de entrada (IDs vacíos, whitespace)
2. ✅ Cálculos matemáticos (precio * qty)
3. ✅ Filtrado de items (checked, tipo, precio disponible)
4. ✅ Manejo de errores (propagación de excepciones)
5. ✅ Casos edge (lista vacía, sin items marcados)
6. ✅ Cantidades decimales (0.5 kg, etc.)

---

## 🏗️ Arquitectura

### **Clean Architecture - Domain Layer**
```
feature/listdetail/domain/
├── entity/
│   └── ListDetailEntities.kt    (ItemKind, ListItem, ListDetail)
├── repository/
│   └── ListDetailRepository.kt  (Interface - contrato para Data Layer)
└── usecase/
    ├── GetListDetailUseCase.kt  (Obtener detalle)
    ├── CheckItemUseCase.kt      (Marcar/desmarcar)
    └── CalculateTotalUseCase.kt (Calcular total)
```

### **Principios Aplicados**
- ✅ **Single Responsibility**: Cada caso de uso tiene una única responsabilidad
- ✅ **Dependency Inversion**: Domain define interfaces, Data las implementa
- ✅ **No dependencias Android**: Código puro Kotlin
- ✅ **Testeable**: 100% cubierto con tests unitarios
- ✅ **Inyección de dependencias**: Hilt (@Inject constructor)

---

## 🎯 Casos de Uso del Dominio

### **1. Ver Detalle de Lista**
```kotlin
// UI/Presentation → UseCase → Repository → Remote/Local
val listDetail = getListDetailUseCase("list-123")
    .collect { detail ->
        // Mostrar items, título, etc.
    }
```

### **2. Marcar Item como Comprado**
```kotlin
// Usuario hace check en un producto
checkItemUseCase(
    listId = "list-123",
    itemId = "item-456",
    checked = true
)
// Se actualiza localmente (offline-first)
```

### **3. Calcular Total de Compra**
```kotlin
// En tiempo real mientras se marcan items
val total = calculateTotalUseCase(listDetail)
// Muestra: "Total: 12.50 €"
```

---

## 🔄 Flujo de Datos (Offline-First)

### **Obtener Detalle**
1. UI llama a `GetListDetailUseCase`
2. Repository intenta cargar desde servidor
3. Si falla, usa snapshot local (Room)
4. Emite actualizaciones via Flow

### **Marcar Items**
1. UI llama a `CheckItemUseCase`
2. Repository actualiza Room inmediatamente
3. UI se actualiza (reactivo via Flow)
4. No se envía a backend (por especificación)

### **Calcular Total**
1. UI observa `listDetail` via Flow
2. Cada cambio dispara `CalculateTotalUseCase`
3. Total se recalcula en tiempo real
4. UI muestra total actualizado

---

## 📝 Decisiones de Diseño

### **¿Por que ListItem es data class unica?**
- El flujo actual solo recibe items de catalogo desde la API
- Elimina complejidad y ramificaciones innecesarias
- Mantiene el calculo de total consistente

---

## 🚀 Próximos Pasos (FASE 3.2)

### **Data Layer**
- [ ] `ListDetailApi.kt` (GET /api/lists/{id})
- [ ] `ItemEntity.kt` (Room con FK a ListEntity)
- [ ] `ItemDao.kt` (queries con relaciones)
- [ ] `ListDetailRepository.kt` (offline-first con merge)
- [ ] Mappers para CatalogListItem
- [ ] Tests de repository

### **Consideraciones Técnicas**
- Relación 1:N entre ListEntity y ItemEntity
- Índices en Room para performance
- Manejo de discriminator (`kind: "catalog"`)
- Merge inteligente de snapshots

---

## ✅ Criterios de Aceptación (FASE 3.1)

- [x] Entidades de dominio creadas (ListItem, ItemKind, ListDetail)
- [x] Repositorio definido (interface)
- [x] GetListDetailUseCase implementado con validaciones
- [x] CheckItemUseCase implementado con validaciones
- [x] CalculateTotalUseCase implementado con lógica correcta
- [x] 21 tests unitarios pasando
- [x] Sin dependencias Android en Domain Layer
- [x] Código documentado (KDoc)
- [x] Respeta Clean Architecture

---

## 📚 Referencias

- **Documentación**: `docs/implementation/006-implementation-plan.md`
- **Backend API**: `/api/lists/{id}` - Detalle de lista
- **Arquitectura**: `docs/architecture.md`
- **OpenAPI Spec**: `apps/api/src/modules/lists/domain/list.ts`

---

**Estado**: ✅ FASE 3.1 COMPLETADA
**Siguiente**: FASE 3.2 - Data Layer (Repository, API, Room, Tests)
