# Plan de Implementación - Shopping List Android

> **Fecha**: 2026-01-31  
> **Estado**: Análisis completado, listo para implementación

---

## 📊 Estado Actual del Proyecto

### ✅ **Ya implementado**
- Retrofit 2.11.0 + OkHttp 4.12.0
- Kotlinx Serialization
- Jetpack Compose + Material3
- DataStore (para cookies persistentes)
- PersistentCookieJar (cookies HttpOnly)
- TokenAuthenticator (refresh automático en 401)
- DebugInterceptor (logging avanzado)
- Endpoints básicos: `/health`, `/api/auth/login`, `/api/lists`

### ❌ **Falta implementar**
- Clean Architecture (feature-first)
- Room (almacenamiento local para offline-first)
- Coil (carga de imágenes)
- ViewModels (MVVM)
- DTOs completos según OpenAPI
- Tests (TDD)
- Features completas (auth, lists, detail, complete, sync)

---

## 🎯 Plan de Implementación (Priorizado)

### **FASE 0: Fundamentos (infraestructura crítica)**
**Objetivo**: Preparar la base técnica para Clean Architecture offline-first

#### 0.1 Añadir dependencias faltantes
- [ ] Room (offline storage)
- [ ] Coil (imágenes)
- [ ] Hilt (DI - opcional pero recomendado)
- [ ] Coroutines Test
- [ ] MockK / Mockito

#### 0.2 Estructura de packages (feature-first)
```
com.alentadev.shopping/
├─ core/
│  ├─ data/
│  │  └─ database/          # Room Database config
│  ├─ network/              # Retrofit (ya existe, refactor)
│  └─ util/                 # Extensions, constants
├─ feature/
│  ├─ auth/
│  │  ├─ domain/
│  │  │  ├─ entity/        # User, Session
│  │  │  └─ usecase/       # LoginUseCase, LogoutUseCase
│  │  ├─ data/
│  │  │  ├─ remote/        # AuthApi, DTOs
│  │  │  ├─ local/         # SessionDao
│  │  │  └─ repository/    # AuthRepository
│  │  └─ ui/
│  │     ├─ login/         # LoginScreen, LoginViewModel
│  │     └─ navigation/
│  ├─ lists/
│  │  ├─ domain/
│  │  │  ├─ entity/        # ShoppingList, ListStatus
│  │  │  └─ usecase/       # GetActiveListsUseCase
│  │  ├─ data/
│  │  │  ├─ remote/        # ListsApi, DTOs
│  │  │  ├─ local/         # ListEntity, ListDao
│  │  │  └─ repository/    # ListsRepository
│  │  └─ ui/
│  │     ├─ list/          # ActiveListsScreen, ListsViewModel
│  │     └─ navigation/
│  ├─ listdetail/
│  │  ├─ domain/
│  │  │  ├─ entity/        # ListItem, ItemKind
│  │  │  └─ usecase/       # GetListDetailUseCase, CheckItemUseCase
│  │  ├─ data/
│  │  │  ├─ remote/        # ListDetailApi, DTOs
│  │  │  ├─ local/         # ItemEntity, ItemDao
│  │  │  └─ repository/    # ListDetailRepository
│  │  └─ ui/
│  │     ├─ detail/        # ListDetailScreen, DetailViewModel
│  │     └─ components/    # ItemCard, CheckBox, TotalBar
│  └─ sync/
│     ├─ domain/
│     │  └─ usecase/       # SyncSnapshotUseCase, MergeUseCase
│     ├─ data/
│     │  └─ repository/    # SyncRepository
│     └─ worker/           # WorkManager (background sync)
└─ app/
   └─ navigation/          # NavGraph principal
```

#### 0.3 DTOs completos según OpenAPI
- [ ] `AuthDtos.kt`: LoginRequest, PublicUser
- [ ] `ListDtos.kt`: ListSummary, ListDetail, ListStatus
- [ ] `ItemDtos.kt`: ListItemDto, ManualListItem, CatalogListItem
- [ ] `ErrorDtos.kt`: AppError, ValidationError

#### 0.4 Room Database Schema
- [ ] `UserEntity`
- [ ] `ListEntity` (snapshot local)
- [ ] `ItemEntity` (con relación a ListEntity)
- [ ] `SyncMetadataEntity` (timestamps, versiones)

---

### **FASE 1: Autenticación (CRÍTICO - Sin esto nada funciona)**
**Objetivo**: Login funcional con refresh automático

#### 1.1 Domain Layer
- [ ] `User.kt` (entity)
- [ ] `Session.kt` (entity)
- [ ] `LoginUseCase.kt`
- [ ] `LogoutUseCase.kt`
- [ ] `GetCurrentUserUseCase.kt`
- [ ] Tests unitarios de casos de uso

#### 1.2 Data Layer
- [ ] `AuthApi.kt` (endpoints: /login, /logout, /refresh, /users/me)
- [ ] `AuthRemoteDataSource.kt`
- [ ] `AuthLocalDataSource.kt` (Room + DataStore)
- [ ] `AuthRepository.kt` (implementación)
- [ ] Mappers: DTO ↔ Entity
- [ ] Tests de repository

#### 1.3 UI Layer
- [ ] `LoginScreen.kt` (Compose)
- [ ] `LoginViewModel.kt` (state management)
- [ ] `LoginUiState.kt` (sealed class)
- [ ] Navegación: LoginScreen → ActiveListsScreen
- [ ] Strings.xml (mensajes de error)
- [ ] Tests de ViewModel

#### 1.4 Integración
- [ ] Validar TokenAuthenticator con nuevos DTOs
- [ ] Manejo de errores (401, 400, red)
- [ ] Loading states
- [ ] Retry con backoff (2 intentos: 1s, 3s)

---

### **FASE 2: Listas Activas (CORE - Pantalla principal)**
**Objetivo**: Mostrar listas con status=ACTIVE

#### 2.1 Domain Layer
- [ ] `ShoppingList.kt` (entity con id, title, status, updatedAt)
- [ ] `ListStatus.kt` (enum: DRAFT, ACTIVE, COMPLETED)
- [ ] `GetActiveListsUseCase.kt`
- [ ] `RefreshListsUseCase.kt`
- [ ] Tests unitarios

#### 2.2 Data Layer
- [ ] `ListsApi.kt` (GET /api/lists?status=ACTIVE)
- [ ] `ListEntity.kt` (Room)
- [ ] `ListDao.kt` (queries para snapshot local)
- [ ] `ListsRepository.kt` (remote + local con offline-first)
- [ ] Mappers DTO ↔ Entity ↔ Domain
- [ ] Tests de repository

#### 2.3 UI Layer
- [ ] `ActiveListsScreen.kt` (lista con LazyColumn)
- [ ] `ListsViewModel.kt` (LiveData/StateFlow)
- [ ] `ListsUiState.kt` (Loading, Success, Error, Empty)
- [ ] `ListCard.kt` (componente reutilizable)
- [ ] Pull-to-refresh
- [ ] Strings.xml
- [ ] Tests de ViewModel

#### 2.4 Offline-first
- [ ] Guardar snapshot local al cargar listas
- [ ] Detectar falta de red
- [ ] Mostrar banner "Sin conexión. Usando datos guardados."
- [ ] Estado vacío: "No tienes listas activas"

---

### **FASE 3: Detalle de Lista (CORE - Funcionalidad principal)**
**Objetivo**: Ver productos, marcar checks offline, calcular total

#### 3.1 Domain Layer
- [ ] `ListItem.kt` (entity)
- [ ] `ItemKind.kt` (enum: MANUAL, CATALOG)
- [ ] `GetListDetailUseCase.kt`
- [ ] `CheckItemUseCase.kt` (toggle checked local)
- [ ] `CalculateTotalUseCase.kt` (sum de checked items)
- [ ] Tests unitarios

#### 3.2 Data Layer
- [ ] `ListDetailApi.kt` (GET /api/lists/{id})
- [ ] `ItemEntity.kt` (Room con FK a ListEntity)
- [ ] `ItemDao.kt` (queries con relaciones)
- [ ] `ListDetailRepository.kt` (offline-first con merge)
- [ ] Mappers para ManualListItem y CatalogListItem
- [ ] Tests de repository

#### 3.3 UI Layer
- [ ] `ListDetailScreen.kt` (LazyColumn con items)
- [ ] `DetailViewModel.kt` (state con checks locales)
- [ ] `ItemCard.kt` (nombre, precio, qty, thumbnail, checkbox)
- [ ] `TotalBar.kt` (sticky bottom bar con total EUR)
- [ ] Estilo visual: item checked → tachado leve + gris
- [ ] Coil para cargar thumbnails
- [ ] Strings.xml
- [ ] Tests de ViewModel

#### 3.4 Cálculo de Total
- [ ] Lógica: `precio * qty` para items checked
- [ ] Formato: EUR sin redondeos
- [ ] Actualización reactiva al marcar/desmarcar

#### 3.5 Offline-first
- [ ] Guardar checks localmente (no enviar a backend)
- [ ] Funcionar sin red
- [ ] Banner si hay cambios remotos detectados

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

### **Sprint 1: Fundamentos + Auth (1-2 semanas)**
1. FASE 0.1-0.4: Dependencias + estructura + DTOs + Room
2. FASE 1: Auth completa (TDD)

### **Sprint 2: Listas (1 semana)**
3. FASE 2: Active Lists con offline-first básico

### **Sprint 3: Detalle (1-2 semanas)**
4. FASE 3: List Detail + checks + total

### **Sprint 4: Completar + Sync (1 semana)**
5. FASE 4: Completar lista
6. FASE 5: Sincronización avanzada

### **Sprint 5: Quality (1 semana)**
7. FASE 6: Testing exhaustivo
8. FASE 7: Polish y documentación

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

