# Plan de Implementación - Shopping List Android

> **Fecha**: 2026-01-31  
> **Última actualización**: 2026-02-28
> **Estado**: FASE 3.5 Completada, Navegación pendiente

---

## 📊 Estado Actual del Proyecto

### ✅ **Ya implementado**
- Retrofit 2.11.0 + OkHttp 4.12.0
- Kotlinx Serialization
- Jetpack Compose + Material3
- DataStore (para cookies persistentes)
- PersistentCookieJar (cookies HttpOnly) + Serialización
- TokenAuthenticator (refresh automático en 401) ✨ MEJORADO - **Usa AuthApi (respeta arquitectura)**
- DebugInterceptor (logging avanzado)
- RetryInterceptor (backoff exponencial 1s, 2s, 4s) ✨ NUEVO
- DeviceFingerprintProvider (fingerprint único del dispositivo)
- Endpoints: `/health`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`, `/users/me`
- **FASE 1**: Autenticación completa (33 tests) ✅ COMPLETADA
- **FASE 2**: Listas Activas - Domain + Data + UI ✅ COMPLETADA
- **FASE 3.1**: Detalle de Lista - Domain Layer (6 tests) ✅ COMPLETADA
- **FASE 3.2**: Detalle de Lista - Data Layer (18 tests) ✅ COMPLETADA
- **FASE 3.3**: Detalle de Lista - UI Layer ✅ COMPLETADA
- **FASE 3.5**: Offline-First - Detalle de Lista (35+ tests) ✅ COMPLETADA
  - SyncCheckUseCase.kt (sincronización real con servidor)
  - ListDetailApi.updateItemCheck() (PATCH /api/lists/:id/items/:itemId)
  - UpdateItemCheckRequest (DTO @Serializable con {"checked": true})
  - ListDetailRemoteDataSource.updateItemCheck() (llamada HTTP)
  - ListDetailRepository.syncItemCheck() (método de sincronización)
  - DetectRemoteChangesUseCase.kt (detección de cambios remotos)
  - ListDetailUiState extendido (SyncStatus enum, fromCache, hasRemoteChanges)
  - DetailViewModel mejorado (NetworkMonitor, observeConnectivity, logging)
  - ListDetailScreen mejorado (2 banners offline-first + spinner)
  - Detecta cambios remotos automáticamente
  - Sincronización en background al hacer check
  - Logging completo en toda la cadena (ViewModel → Repository → API)
  - 35+ tests unitarios PASSING

### ❌ **Falta implementar**
- Navegación completa (LoginScreen → ActiveListsScreen → DetailScreen)
- FASE 4: Completar lista
- FASE 5+: Refinamiento y sincronización avanzada

---

## 🎯 Plan de Implementación (Priorizado)

### **FASE 0: Fundamentos (infraestructura crítica) ✅ COMPLETADA**
**Objetivo**: Preparar la base técnica para Clean Architecture offline-first

#### 0.1 Añadir dependencias faltantes ✅
- [x] Room (offline storage)
- [x] Coil (imágenes)
- [x] Hilt (DI)
- [x] Coroutines Test
- [x] MockK

#### 0.2 Estructura de packages (feature-first) ✅
- [x] Estructura completa implementada y respetada

#### 0.3 DTOs completos según OpenAPI ✅
- [x] `AuthDtos.kt`: LoginRequest, PublicUser
- [x] `ListDtos.kt`: ListSummary, ListDetail, ListStatus
- [x] `ItemDtos.kt`: ListItemDto, CatalogListItem
- [x] `ErrorDtos.kt`: AppError, ValidationError

#### 0.4 Room Database Schema ✅
- [x] `UserEntity`
- [x] `ListEntity` (snapshot local)
- [x] `ItemEntity` (con relación a ListEntity)
- [x] `SyncMetadataEntity` (timestamps, versiones)

---

### **FASE 1: Autenticación (CRÍTICO - Sin esto nada funciona) ✅ COMPLETADA**
**Objetivo**: Login funcional con refresh automático
**Estado**: 33 tests pasando, Build exitoso, Funcionalidad probada end-to-end

#### 1.1 Domain Layer ✅ COMPLETADA
- [x] `User.kt` (entity) - Entidad de usuario con @Serializable ✅
- [x] `Session.kt` (entity) - Entidad de sesión con @Serializable ✅
- [x] `LoginUseCase.kt` - Validaciones y delegación a repository ✅
- [x] `LogoutUseCase.kt` - Limpieza de sesión ✅
- [x] `GetCurrentUserUseCase.kt` - Obtención de usuario actual ✅
- [x] Tests unitarios de casos de uso ✅ (11 tests PASSING)

#### 1.2 Data Layer ✅ COMPLETADA
- [x] `AuthApi.kt` - Endpoints: /login, /logout, /refresh, /users/me ✅
- [x] `AuthRemoteDataSource.kt` - HTTP requests con fingerprint dinámico ✅
- [x] `AuthLocalDataSource.kt` - Guardado en DataStore ✅
- [x] `AuthRepositoryImpl.kt` - Implementación con mappers ✅
- [x] `AuthMapper.kt` - Mappers DTO ↔ Domain ✅
- [x] `AuthDtos.kt` - LoginRequest, PublicUserDto, OkResponse ✅
- [x] Tests de repository ✅ (8 tests PASSING)

#### 1.3 Network Integration & DI ✅ COMPLETADA
- [x] `TokenAuthenticator` - Usa AuthApi.refreshToken() (respeta arquitectura) ✅
- [x] `RetryInterceptor` - Backoff exponencial: 1s, 2s, 4s (3 intentos) ✅
- [x] `PersistentCookieJar` - Cookies persistentes en DataStore ✅
- [x] `DeviceFingerprintProvider` - Fingerprint único: ANDROID_ID + modelo ✅
- [x] `NetworkModule.kt` - DI con Lazy provider para evitar ciclo ✅
- [x] `DataStoreModule.kt` - DI de DataStore ✅
- [x] `AuthModule.kt` - DI de AuthRepository ✅
- [x] Manejo de errores: 401, 400, timeout, conexión ✅
- [x] Retrofit logging y HTTP debugging ✅
- [x] Tests de network ✅ (6 tests PASSING)

#### 1.4 Presentation Layer (UI + State Management) ✅ COMPLETADA
- [x] `LoginScreen.kt` - Compose UI completa con validaciones ✅
- [x] `LoginViewModel.kt` - @HiltViewModel con StateFlow ✅
- [x] `LoginUiState.kt` - Sealed class: Idle, Loading, Success, Error ✅
- [x] `LoginNavigation.kt` - Rutas y transiciones ✅
- [x] `strings.xml` - 15+ textos (login, errores, validaciones) ✅
- [x] Toast de bienvenida: "¡Bienvenido {nombre}! Login exitoso" ✅
- [x] Botón "🍪 Probar Cookies" - Verifica persistencia de cookies ✅
- [x] Tests de ViewModel ✅ (7 tests PASSING)

#### 1.5 Features Adicionales Implementadas ✅
- [x] Fingerprint único del dispositivo (no hardcodeado)
- [x] Cookies HttpOnly persistentes en DataStore
- [x] Refresh automático de tokens en 401
- [x] Retry con backoff exponencial
- [x] Logging detallado (debug + HTTP)
- [x] Validación de email y password en cliente
- [x] Sesión guardada en DataStore (@Serializable)
- [x] Prueba de cookies funcionales (GetCurrentUserUseCase)

#### 1.6 Tests ✅ COMPLETADOS
- [x] Domain Layer: 11 tests ✅
- [x] Data Layer: 8 tests ✅
- [x] Network Layer: 6 tests ✅
- [x] Presentation Layer: 7 tests ✅
- **Total: 33 tests PASSING** ✅

---

---

### **FASE 2: Listas Activas (CORE - Pantalla principal)**
**Objetivo**: Mostrar listas con status=ACTIVE

#### 2.1 Domain Layer 🚀 EN PROGRESO
- [x] `ShoppingList.kt` (entity con id, title, status, updatedAt) ✅ CREADO
- [x] `ListStatus.kt` (enum: DRAFT, ACTIVE, COMPLETED) ✅ (dentro de ShoppingList.kt)
- [x] `GetActiveListsUseCase.kt` ✅ CREADO
- [x] `RefreshListsUseCase.kt` ✅ CREADO
- [x] `ListsRepository.kt` (interface) ✅ CREADO
- [x] `GetActiveListsUseCaseTest.kt` - 4 tests ✅ CREADO
- [x] `RefreshListsUseCaseTest.kt` - 4 tests ✅ CREADO
- [ ] Compilar y ejecutar tests

#### 2.2 Data Layer ✅ COMPLETADA
- [x] `ListsApi.kt` (GET /api/lists?status=ACTIVE) ✅ CREADO
- [x] `ListEntity.kt` (Room) ✅ CREADO
- [x] `ListDao.kt` (queries para snapshot local) ✅ CREADO
- [x] `ListsRemoteDataSource.kt` (acceso a API) ✅ CREADO
- [x] `ListsLocalDataSource.kt` (acceso a Room) ✅ CREADO
- [x] `ListsRepositoryImpl.kt` (offline-first: remote + local) ✅ CREADO
- [x] `ListDtos.kt` - ListSummaryDto ✅ CREADO
- [x] Tests de repository (6 tests) ✅ CREADO
- [x] Tests de remote data source (5 tests) ✅ CREADO
- [ ] Compilar y ejecutar tests

#### 2.3 UI Layer ✅ IMPLEMENTADA (pendiente ejecutar tests)
- [x] `ActiveListsScreen.kt` (lista con LazyColumn) ✅ CREADO
- [x] `ListsViewModel.kt` (StateFlow) ✅ CREADO
- [x] `ListsUiState.kt` (Loading, Success, Error, Empty) ✅ CREADO
- [x] `ListCard.kt` (componente reutilizable) ✅ CREADO
- [ ] Pull-to-refresh
- [x] Strings.xml ✅ AÑADIDO
- [x] Tests de ViewModel ✅ CREADO
- [ ] Compilar y ejecutar tests

#### 2.4 Offline-first ✅ COMPLETADA
- [x] Guardar snapshot local al cargar listas ✅ (ListsRepositoryImpl)
- [x] Fallback a cache local cuando no hay red ✅ (getActiveListsWithSource)
- [x] Detectar falta de red ✅ (NetworkMonitor con Flow)
- [x] Mostrar banner "Sin conexión. Mostrando datos guardados" ✅ (ActiveListsScreen)
- [x] Estado vacío: "No tienes listas activas" + subtítulo ✅ (ActiveListsScreen)

---

### **FASE 3: Detalle de Lista (CORE - Funcionalidad principal) ✅ COMPLETADA**
**Objetivo**: Ver productos, marcar checks offline, calcular total, offline-first completo

#### 3.1 Domain Layer ✅ COMPLETADA
- [x] `ListDetailEntities.kt` (sealed class + subclases)
  - [x] `ListItem` (sealed class base)
  - [x] `ItemKind` (enum: MANUAL, CATALOG)
  - [x] `CatalogItem` (con precio, thumbnail, etc)
  - [x] `ManualItem` (simple, solo nota opcional)
  - [x] `ListDetail` (lista con items)
- [x] `GetListDetailUseCase.kt` - Obtiene detalle de lista
- [x] `CheckItemUseCase.kt` - Toggle checked local
- [x] `CalculateTotalUseCase.kt` - Suma de items checked
- [x] Tests unitarios (6 tests PASSING)

#### 3.2 Data Layer ✅ COMPLETADA
- [x] `ListDetailApi.kt` (GET /api/lists/{id})
- [x] `ItemEntity.kt` (Room con FK a ListEntity)
- [x] `ItemDao.kt` (queries con relaciones)
- [x] `ListDetailRemoteDataSource.kt` (acceso a API)
- [x] `ListDetailLocalDataSource.kt` (acceso a Room)
- [x] `ListDetailRepositoryImpl.kt` (offline-first con merge)
- [x] `ItemDtos.kt` - DTOs para items
- [x] `ListDetailDtos.kt` - DTOs para respuesta
- [x] Mappers DTO ↔ Domain (ListDetail, ListItem)
- [x] Tests de repository (7 tests)
- [x] Tests de remote data source (5 tests)
- [x] Tests de local data source (6 tests)
- [x] DI Module `ListDetailModule.kt`

#### 3.3 UI Layer ✅ COMPLETADA
- [x] `ListDetailScreen.kt` (LazyColumn con items + banners)
- [x] `DetailViewModel.kt` (state con checks locales + offline)
- [x] `ItemCard.kt` (nombre, precio, qty, thumbnail, checkbox)
- [x] `TotalBar.kt` (sticky bottom bar con total EUR)
- [x] Estilo visual: item checked → tachado leve + gris
- [x] Coil para cargar thumbnails
- [x] Strings.xml
- [x] Tests de ViewModel (6 tests)
- [x] 2 Banners offline-first (naranja + rojo)
- [x] Spinner de sincronización en TopAppBar

#### 3.4 Cálculo de Total ✅ COMPLETADA
- [x] Lógica: `precio * qty` para items checked
- [x] Formato: EUR sin redondeos
- [x] Actualización reactiva al marcar/desmarcar

#### 3.5 Offline-first ✅ COMPLETADA
- [x] Guardar checks localmente e intentar sincronizar en background
  - [x] `SyncCheckUseCase.kt` - Intenta sincronización con servidor ✅
  - [x] `ListDetailApi.updateItemCheck()` - PATCH /api/lists/:id/items/:itemId ✅
  - [x] `UpdateItemCheckRequest` - DTO serializable para body {"checked": true} ✅
  - [x] `ListDetailRemoteDataSource.updateItemCheck()` - Llama al API ✅
  - [x] `ListDetailRepository.syncItemCheck()` - Método de sincronización ✅
  - [x] `DetailViewModel.toggleItemCheck()` - Orquesta guardado local + sync ✅
  - [x] Flujo completo: checkItemUseCase (local) → syncCheckUseCase (si conexión) ✅
  - [x] Logging detallado en toda la cadena ✅
- [x] Funcionar sin red
  - [x] App 100% funcional offline con datos cacheados ✅
  - [x] Banner naranja informativo ✅
  - [x] Cambios guardados en Room automáticamente ✅
- [x] Banner si hay cambios remotos detectados
  - [x] `DetectRemoteChangesUseCase.kt` - Detecta cambios en servidor ✅
  - [x] Se ejecuta automáticamente al recuperar conexión ✅
  - [x] Banner rojo con botón "Actualizar" ✅
  - [x] `ListDetailUiState` extendido (SyncStatus enum, fromCache, hasRemoteChanges) ✅
  - [x] `ListDetailScreen` mejorado (2 banners + spinner) ✅
  - [x] `DetailViewModel` mejorado (NetworkMonitor, observeConnectivity) ✅
- [x] Tests offline-first (35+ tests PASSING) ✅
- [x] Documentación completa (5 archivos) ✅

---

### **FASE 4: Completar Lista (SECUNDARIO)**
**Objetivo**: Finalizar compra con confirmación

#### 4.1 Domain Layer
- [ ] `CompleteListUseCase.kt`
- [ ] Validaciones (puede completarse con items sin marcar)
- [ ] Tests unitarios

#### 4.2 Data Layer
- [ ] `CompleteListApi.kt` (POST /api/lists/{id}/complete)
- [ ] `CompleteListRequest.kt` (DTO con checkedItemIds)
- [ ] `ListDetailRepository.completeList()`
- [ ] Tests de repository

#### 4.3 UI Layer
- [ ] Botón "Completar lista" en DetailScreen
- [ ] `ConfirmCompleteDialog.kt` (modal de confirmación)
- [ ] Mensaje: "¿Completar la lista? Puedes finalizar aunque queden productos."
- [ ] Navegación: tras completar → volver a ActiveLists
- [ ] Strings.xml
- [ ] Tests de ViewModel

#### 4.4 Manejo de errores
- [ ] Sin red: mostrar aviso y retry
- [ ] Transición inválida (400): mostrar error específico

---

### **FASE 5: Sincronización Offline (REFINAMIENTO)**
**Objetivo**: Merge inteligente con confirmación del usuario

#### 5.1 Detección de conectividad
- [ ] `NetworkMonitor.kt` (ConnectivityManager + Flow)
- [ ] Integrar en ViewModels (collect network state)

#### 5.2 Merge Logic
- [ ] `SyncRepository.kt`
- [ ] `MergeSnapshotUseCase.kt`
- [ ] Comparar versión local vs remota (updatedAt)
- [ ] Detectar productos eliminados en backend
- [ ] Tests unitarios de merge

#### 5.3 UI de avisos
- [ ] Banner no intrusivo: "La lista cambió en la web. Revisa los cambios."
- [ ] Modal para cambios críticos (producto eliminado)
- [ ] Pantalla completa de "Sin conexión" si no hay snapshot
- [ ] Botón "Reintentar"
- [ ] Strings.xml

#### 5.4 Retry con backoff
- [ ] Interceptor con retry automático (2 intentos: 1s, 3s)
- [ ] Luego mostrar opción manual de reintentar

#### 5.5 Logout
- [ ] Limpiar sesión
- [ ] **Borrar todos los snapshots locales**
- [ ] Volver a LoginScreen

---

### **FASE 6: Testing (CALIDAD)**
**Objetivo**: Cobertura de tests críticos

#### 6.1 Tests unitarios
- [ ] Todos los casos de uso
- [ ] Repositories (con mocks de API y DAO)
- [ ] Mappers

#### 6.2 Tests de ViewModels
- [ ] Flujos de estado completos
- [ ] Manejo de errores
- [ ] Loading states

#### 6.3 Tests de integración
- [ ] Auth flow completo
- [ ] Lista → Detalle → Completar
- [ ] Offline → Online merge

#### 6.4 Tests de UI (críticos)
- [ ] Login flow
- [ ] Check de productos
- [ ] Confirmación de completar lista

---

### **FASE 7: Polish (ÚLTIMAS MILLAS)**
**Objetivo**: App lista para producción

#### 7.1 Error handling robusto
- [ ] Mensajes de error consistentes
- [ ] Fallbacks para imágenes (thumbnail no disponible)
- [ ] Validaciones de formulario

#### 7.2 UX refinement
- [ ] Animaciones (checks, navegación)
- [ ] Empty states con ilustraciones
- [ ] Pull-to-refresh feedback
- [ ] Loading skeletons

#### 7.3 Strings.xml completo
- [ ] Todos los textos externalizados
- [ ] Preparado para i18n

#### 7.4 Performance
- [ ] LazyColumn optimizations
- [ ] Coil caching
- [ ] Room indices

#### 7.5 Documentación final
- [ ] Actualizar architecture.md
- [ ] README con setup instructions
- [ ] Comentarios en código crítico

---

## 🚀 Orden de Ejecución Recomendado

### **Sprint 1: Fundamentos + Auth Domain & Data (✅ COMPLETADO)**
1. ✅ FASE 0: Dependencias + estructura + DTOs + Network setup
2. ✅ FASE 1.1: Domain Layer (LoginUseCase, LogoutUseCase, GetCurrentUserUseCase)
3. ✅ FASE 1.2: Data Layer (AuthRepository, RemoteDataSource, LocalDataSource)
4. ✅ FASE 1.3: Network Integration (RetryInterceptor, TokenAuthenticator mejorado, cleanup)

### **Sprint 2: Auth UI + Login Screen (✅ COMPLETADO)**
5. ✅ FASE 1.4: Presentation Layer (LoginScreen, ViewModel, StateFlow, Strings.xml)
6. ✅ FASE 1.5: Features adicionales (Fingerprint, Cookies, Prueba de cookies)
7. ✅ FASE 1.6: Tests y validación (33 tests PASSING, Build SUCCESSFUL)

### **Sprint 3: Navegación + Listas (📋 PRÓXIMO)**
8. 📋 FASE 1.7: Navegación completa (NavGraph, LoginScreen → ActiveListsScreen)
9. 📋 FASE 2: Active Lists con offline-first básico
   - Domain: GetActiveListsUseCase, ShoppingList entity
   - Data: ListsApi, ListEntity, ListsRepository
   - UI: ActiveListsScreen, ListsViewModel, Pull-to-refresh

### **Sprint 4: Detalle (✅ COMPLETADO)**
10. ✅ FASE 3: List Detail + checks + total
    - Domain: GetListDetailUseCase, CheckItemUseCase
    - Data: ListDetailApi, ItemEntity, ListDetailRepository
    - UI: DetailScreen, ItemCard, TotalBar
    - Offline-first: SyncCheckUseCase, DetectRemoteChangesUseCase, Banners, Spinner

### **Sprint 5: Completar + Sync (⏳ PENDIENTE)**
11. ⏳ FASE 4: Completar lista
12. ⏳ FASE 5: Sincronización avanzada

### **Sprint 6: Quality (⏳ PENDIENTE)**
13. ⏳ FASE 6: Testing exhaustivo
14. ⏳ FASE 7: Polish y documentación

---

## 📝 Notas Importantes

### **Decisiones arquitectónicas**
- **DI**: Hilt recomendado (standar Android moderno)
- **State**: StateFlow + Compose state
- **Navigation**: Jetpack Navigation Compose
- **Storage**: Room (snapshots) + DataStore (cookies/prefs)
- **Images**: Coil (integración nativa con Compose)

### **Restricciones del proyecto**
- TDD obligatorio
- Cambios pequeños y aislados
- Sin librerías nuevas sin justificación
- Textos en strings.xml (cero hardcode)
- Domain layer sin dependencias Android

### **Endpoints críticos según OpenAPI**
- `POST /api/auth/login` → Login
- `GET /api/lists?status=ACTIVE` → Listas activas
- `GET /api/lists/{id}` → Detalle con items
- `POST /api/lists/{id}/complete` → Completar lista
- `PATCH /api/lists/{id}/items/{itemId}` → Actualizar item (checked)

### **Features NO implementadas (fuera de scope)**
- Registro (solo en web)
- Crear/editar listas (solo en web)
- Añadir productos (solo en web)
- Historial completo (solo en web)
- Login con QR (futuro)
- Autosave draft (web feature)
- Catálogo Mercadona (web feature)
- Duplicar listas (web feature)

---

## ✅ Checklist de Inicio

Antes de empezar FASE 0:
- [ ] Confirmar estrategia de DI (Hilt/Koin/Manual)
- [ ] Confirmar preferencia TDD estricto vs MVP rápido
- [ ] Validar que el backend está corriendo en localhost:3000
- [ ] Revisar gitignore (si aún no está hecho)

**¿Listo para empezar?** 🚀

```

### **Sprint 2: Auth UI + Login Screen (✅ COMPLETADO)**
5. ✅ FASE 1.4: Presentation Layer (LoginScreen, ViewModel, StateFlow, Strings.xml)
6. ✅ FASE 1.5: Features adicionales (Fingerprint, Cookies, Prueba de cookies)
7. ✅ FASE 1.6: Tests y validación (33 tests PASSING, Build SUCCESSFUL)

### **Sprint 3: Navegación + Listas (📋 PRÓXIMO)**
8. 📋 FASE 1.7: Navegación completa (NavGraph, LoginScreen → ActiveListsScreen)
9. 📋 FASE 2: Active Lists con offline-first básico
   - Domain: GetActiveListsUseCase, ShoppingList entity
   - Data: ListsApi, ListEntity, ListsRepository
   - UI: ActiveListsScreen, ListsViewModel, Pull-to-refresh

### **Sprint 4: Detalle (⏳ PENDIENTE)**
10. FASE 3: List Detail + checks + total
    - Domain: GetListDetailUseCase, CheckItemUseCase
    - Data: ListDetailApi, ItemEntity, ListDetailRepository
    - UI: DetailScreen, ItemCard, TotalBar

### **Sprint 5: Completar + Sync (⏳ PENDIENTE)**
11. FASE 4: Completar lista
12. FASE 5: Sincronización avanzada

### **Sprint 6: Quality (⏳ PENDIENTE)**
13. FASE 6: Testing exhaustivo
14. FASE 7: Polish y documentación

---

## 📝 Notas Importantes

### **Decisiones arquitectónicas**
- **DI**: Hilt recomendado (standar Android moderno)
- **State**: StateFlow + Compose state
- **Navigation**: Jetpack Navigation Compose
- **Storage**: Room (snapshots) + DataStore (cookies/prefs)
- **Images**: Coil (integración nativa con Compose)

### **Restricciones del proyecto**
- TDD obligatorio
- Cambios pequeños y aislados
- Sin librerías nuevas sin justificación
- Textos en strings.xml (cero hardcode)
- Domain layer sin dependencias Android

### **Endpoints críticos según OpenAPI**
- `POST /api/auth/login` → Login
- `GET /api/lists?status=ACTIVE` → Listas activas
- `GET /api/lists/{id}` → Detalle con items
- `POST /api/lists/{id}/complete` → Completar lista
- `PATCH /api/lists/{id}/items/{itemId}` → Actualizar item (checked)

### **Features NO implementadas (fuera de scope)**
- Registro (solo en web)
- Crear/editar listas (solo en web)
- Añadir productos (solo en web)
- Historial completo (solo en web)
- Login con QR (futuro)
- Autosave draft (web feature)
- Catálogo Mercadona (web feature)
- Duplicar listas (web feature)

---

## ✅ Checklist de Inicio

Antes de empezar FASE 0:
- [ ] Confirmar estrategia de DI (Hilt/Koin/Manual)
- [ ] Confirmar preferencia TDD estricto vs MVP rápido
- [ ] Validar que el backend está corriendo en localhost:3000
- [ ] Revisar gitignore (si aún no está hecho)

**¿Listo para empezar?** 🚀
