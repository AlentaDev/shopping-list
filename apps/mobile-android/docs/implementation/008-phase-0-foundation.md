# FASE 0: Fundamentos - Estructura Base

## 🎯 Objetivo de FASE 0

Preparar toda la infraestructura necesaria para implementar Clean Architecture:
- ✅ Dependencias (Hilt, Room, Coil, Testing)
- ✅ Estructura de packages (feature-first)
- ✅ DTOs según OpenAPI
- ✅ Room Database base
- ✅ DI setup (Hilt modules)
- ✅ Datos FAKE para desarrollo sin API

---

## 📁 Estructura de Packages Final

```
com.alentadev.shopping/
├─ core/
│  ├─ data/
│  │  ├─ database/
│  │  │  ├─ AppDatabase.kt (Room database singleton)
│  │  │  ├─ dao/
│  │  │  │  ├─ UserDao.kt
│  │  │  │  ├─ ListEntityDao.kt
│  │  │  │  └─ ItemEntityDao.kt
│  │  │  └─ entity/
│  │  │     ├─ UserEntity.kt
│  │  │     ├─ ListEntity.kt
│  │  │     └─ ItemEntity.kt
│  │  └─ di/
│  │     └─ DatabaseModule.kt (Hilt @Module)
│  ├─ network/
│  │  └─ di/
│  │     └─ NetworkModule.kt (Hilt @Module)
│  └─ util/
│     ├─ Result.kt (sealed class para manejo de errores)
│     └─ Extensions.kt
│
├─ feature/
│  ├─ auth/
│  │  ├─ domain/
│  │  │  ├─ entity/
│  │  │  │  ├─ User.kt
│  │  │  │  └─ Session.kt
│  │  │  └─ usecase/ (próxima fase)
│  │  ├─ data/
│  │  │  ├─ remote/ (próxima fase)
│  │  │  ├─ local/ (próxima fase)
│  │  │  └─ repository/ (próxima fase)
│  │  └─ ui/ (próxima fase)
│  │
│  ├─ lists/
│  │  ├─ domain/
│  │  │  └─ entity/
│  │  │     ├─ ShoppingList.kt
│  │  │     └─ ListStatus.kt
│  │  ├─ data/
│  │  │  ├─ remote/
│  │  │  │  └─ dto/ (DTOs según OpenAPI)
│  │  │  ├─ local/ (próxima fase)
│  │  │  └─ repository/ (próxima fase)
│  │  └─ ui/ (próxima fase)
│  │
│  ├─ listdetail/
│  │  ├─ domain/
│  │  │  └─ entity/
│  │  │     ├─ ListItem.kt
│  │  │     ├─ ItemKind.kt
│  │  │     ├─ ManualItem.kt
│  │  │     └─ CatalogItem.kt
│  │  ├─ data/
│  │  │  ├─ remote/
│  │  │  │  └─ dto/ (DTOs según OpenAPI)
│  │  │  ├─ local/ (próxima fase)
│  │  │  └─ repository/ (próxima fase)
│  │  └─ ui/ (próxima fase)
│  │
│  └─ sync/
│     └─ (próxima fase)
│
├─ MainActivity.kt (entry point)
└─ MyApp.kt (Application + Hilt setup)
```

---

## 🔧 Cambios Realizados en FASE 0

### ✅ 1. Dependencias Añadidas

**libs.versions.toml**:
- Hilt 2.51
- Room 2.6.1
- Coil 2.6.0
- MockK 1.13.8
- Turbine 1.0.0
- Coroutines Test 1.8.0

**app/build.gradle.kts**:
- Plugin: `hilt-android`
- Plugin: `kotlin("kapt")`
- Todas las dependencias anteriores

### ✅ 2. DTOs Según OpenAPI

Se crearán archivos para:
- `AuthDtos.kt` (LoginRequest, PublicUser)
- `ListDtos.kt` (ListSummary, ListDetail, ListStatus)
- `ItemDtos.kt` (ListItemDto, ManualListItem, CatalogListItem)
- `ErrorDtos.kt` (AppError, ValidationError)

### ✅ 3. Room Database

Se crearán:
- `UserEntity.kt` (user autenticado)
- `ListEntity.kt` (snapshot de listas)
- `ItemEntity.kt` (snapshot de productos)
- `AppDatabase.kt` (Room database config)
- `*Dao.kt` (data access objects)

### ✅ 4. Domain Entities

Se crearán:
- `User.kt` (entity sin Android)
- `Session.kt` (info de sesión)
- `ShoppingList.kt` (lista con status)
- `ListItem.kt` (producto genérico)
- `ManualItem.kt` (producto manual)
- `CatalogItem.kt` (producto de catálogo)

### ✅ 5. Hilt Modules

Se crearán:
- `NetworkModule.kt` (Retrofit, OkHttp, interceptores)
- `DatabaseModule.kt` (Room database)

### ✅ 6. Datos FAKE

Se crearán:
- `FakeAuthDataSource.kt` (fake auth para testing sin API)
- `FakeListsDataSource.kt` (fake listas para testing sin API)

---

## 📝 Tareas por Hacer en FASE 0

- [ ] Crear estructura de packages
- [ ] Crear DTOs (Auth, Lists, Items, Errors)
- [ ] Crear Room entities + DAOs
- [ ] Crear AppDatabase
- [ ] Crear domain entities
- [ ] Crear Hilt modules (Network, Database)
- [ ] Refactorizar network/ existente (integrar con Hilt)
- [ ] Crear datos FAKE para desarrollo
- [ ] Verificar que compila sin errores
- [ ] Crear tests base (para TDD próximas fases)

---

## 🚀 Después de FASE 0

Una vez completado FASE 0:
- Estructura lista para FASE 1 (Auth)
- DTOs listos para mapear
- Room listo para guardar snapshots
- Hilt listo para DI
- Datos FAKE listos para development sin API

**Tiempo estimado FASE 0**: 2-3 horas de implementación

---

## 📖 Referencia

- Clean Architecture: dependencias unidireccionales (UI → Domain → Data)
- Feature-first: cada feature contiene domain/data/ui
- Core: utilidades compartidas (database, network, etc.)
- DTOs: solo en data layer
- Entities: domain y room (separadas)
- Mappers: convierten DTO → Entity → Domain

