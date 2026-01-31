# Mi Entendimiento del Proyecto

> **Fecha**: 2026-01-31  
> **Propósito**: Validar que he comprendido correctamente todos los requisitos

---

## 🎯 Visión General

### **¿Qué es esta app?**
Una aplicación móvil Android para **compras en supermercado** que funciona como **cliente consumidor** de listas creadas previamente en la aplicación web.

### **Filosofía del producto**
- **Offline-first**: debe funcionar sin conexión dentro del supermercado
- **Simplicidad**: no replica toda la funcionalidad web, solo lo esencial
- **Consumidor**: no crea listas, solo las consume y completa
- **Pragmática**: sin complejidades innecesarias

---

## 📱 Casos de Uso (Lo que el usuario puede hacer)

### **1. Login** (Obligatorio)
- El usuario **YA TIENE cuenta creada en la web**
- Introduce email + password
- El sistema valida con el backend
- Recibe cookies HttpOnly (access 15min, refresh 7d)
- Navega a pantalla de listas activas

**NO puede**:
- ❌ Registrarse desde la app (solo web)
- ❌ Login con QR (futuro)

### **2. Ver Listas Activas** (Pantalla principal)
- Muestra solo listas con `status=ACTIVE`
- Creadas previamente en la web
- Ordena por `updatedAt` (más reciente primero)
- Guarda snapshot local para offline
- Tap en lista → detalle

**NO puede**:
- ❌ Crear listas (solo web)
- ❌ Ver historial completo (solo web)
- ❌ Editar título de lista (solo web)

### **3. Ver Detalle de Lista** (Core functionality)
- Muestra productos de la lista
- Cada producto tiene:
  - Nombre
  - Precio (EUR, puede ser null)
  - Cantidad
  - Thumbnail (puede ser null)
  - Checkbox para marcar como comprado
  - Nota (opcional)
- **Checks son LOCALES** (no envían a backend)
- Calcula total automáticamente: `sum(precio * qty)` de items checked
- Funciona **completamente offline**

**NO puede**:
- ❌ Añadir productos (solo web)
- ❌ Editar productos (solo web)
- ❌ Eliminar productos (solo web)

### **4. Completar Lista**
- Botón "Completar lista"
- Muestra confirmación: "¿Completar la lista? Puedes finalizar aunque queden productos."
- Al confirmar:
  - Envía `checkedItemIds` al backend
  - Backend marca lista como COMPLETED
  - App vuelve a pantalla de listas activas
- **Requiere conexión** (si no hay red, mostrar aviso)

### **5. Sincronización Offline** (Automática)
- Al abrir app, intenta sincronizar
- Si no hay red:
  - Usa snapshot local guardado
  - Muestra banner: "Sin conexión. Usando datos guardados."
- Al recuperar conexión:
  - Compara snapshot local con versión remota
  - Si hay cambios, **avisa al usuario** (no refresh silencioso)
  - Si un producto fue eliminado en backend:
    - Lo elimina localmente
    - Muestra aviso: "Se eliminó un producto desde la web."

### **6. Logout**
- Limpia sesión (cookies)
- **Borra todos los snapshots locales**
- Vuelve a pantalla de login

---

## 🏗️ Arquitectura Obligatoria

### **Clean Architecture + MVVM**
```
UI Layer (Compose + ViewModel)
    ↓ uses
Domain Layer (Use Cases + Entities)
    ↓ uses
Data Layer (Repository + Remote + Local)
```

### **Reglas de dependencias** (ESTRICTAS)
- ✅ UI → Domain → Data (permitido)
- ❌ Data → Domain (prohibido)
- ❌ Domain → UI (prohibido)
- ❌ Domain depende de Android framework (prohibido)

### **Organización por features** (Feature-first)
```
com.alentadev.shopping/
├─ core/           # utilidades compartidas
├─ feature/
│  ├─ auth/       # login, logout, session
│  ├─ lists/      # listas activas
│  ├─ listdetail/ # detalle + checks
│  └─ sync/       # sincronización offline
└─ app/           # wiring, navegación, DI
```

### **Cada feature tiene**
```
feature/auth/
├─ domain/
│  ├─ entity/     # User, Session (POKOs sin Android)
│  └─ usecase/    # LoginUseCase, LogoutUseCase
├─ data/
│  ├─ remote/     # AuthApi, DTOs
│  ├─ local/      # Room DAOs
│  └─ repository/ # AuthRepository (implementación)
└─ ui/
   ├─ login/      # LoginScreen, LoginViewModel
   └─ navigation/ # destinos de navegación
```

---

## 🔐 Autenticación (Detalles técnicos)

### **Flujo de login**
1. Usuario introduce email + password
2. `POST /api/auth/login`
3. Backend valida y retorna:
   ```json
   {
     "id": "uuid",
     "name": "Juan",
     "email": "juan@example.com",
     "postalCode": "28001"
   }
   ```
4. Cookies HttpOnly en headers:
   - `access_token` (15 minutos)
   - `refresh_token` (7 días, rota en cada refresh)

### **Refresh automático**
- Si una request retorna **401 Unauthorized**:
  1. TokenAuthenticator intercepta
  2. Hace `POST /api/auth/refresh` automáticamente
  3. Reintenta la request original con nuevo access_token
  4. Si refresh falla → logout automático

### **Reintentos**
- 2 reintentos con backoff exponencial (1s, 3s)
- Luego mostrar opción manual "Reintentar"

---

## 💾 Almacenamiento Local (Room)

### **¿Qué se guarda?**

#### **Snapshot de listas**
```kotlin
@Entity
data class ListEntity(
    @PrimaryKey val id: String,
    val title: String,
    val status: String, // ACTIVE, COMPLETED
    val updatedAt: String,
    val syncedAt: Long // timestamp local
)
```

#### **Snapshot de items**
```kotlin
@Entity
data class ItemEntity(
    @PrimaryKey val id: String,
    val listId: String, // FK a ListEntity
    val kind: String, // manual | catalog
    val name: String,
    val qty: Int,
    val price: Double?, // nullable
    val thumbnail: String?, // nullable
    val checked: Boolean, // estado LOCAL
    val note: String?,
    // campos específicos de catalog
    val source: String?,
    val sourceProductId: String?,
    val unitSize: Double?,
    val unitFormat: String?,
    val unitPrice: Double?,
    val isApproxSize: Boolean?
)
```

### **¿Cuándo se guarda?**
- **Al cargar listas activas** → snapshot de ListEntity
- **Al abrir detalle** → snapshot de ItemEntity
- **Al marcar/desmarcar** → actualiza `checked` en ItemEntity

### **¿Cuándo se borra?**
- **Al hacer logout** → borrar TODO
- **Al detectar que una lista ya no es ACTIVE** → borrar su snapshot

---

## 🌐 Manejo de Red

### **Sin conexión inicial (app abre offline)**
- Verifica conectividad
- Si no hay red:
  - Carga snapshots de Room
  - Muestra banner: "Sin conexión. Usando datos guardados."
  - Permite navegar y marcar checks

### **Sin snapshots + sin red**
- Pantalla completa de error
- Mensaje: "No hay conexión ni datos guardados."
- Botón "Reintentar"

### **Con snapshots + sin red**
- Banner no intrusivo (Snackbar)
- Permite uso completo offline
- Al recuperar red: intenta sincronizar

### **Recuperar conexión (merge)**
1. Detecta que hay conexión
2. Hace GET /api/lists?status=ACTIVE
3. Compara `updatedAt` con snapshot local
4. Si hay cambios:
   - Muestra aviso: "La lista cambió en la web. Revisa los cambios."
   - Usuario puede revisar o ignorar
5. Si un producto fue eliminado:
   - Elimina localmente
   - Muestra aviso: "Se eliminó un producto desde la web."

### **NO hacer refresh silencioso**
- ❌ Nunca sobreescribir sin avisar
- ✅ Siempre mostrar aviso de cambios

---

## 🎨 UI/UX (Detalles específicos)

### **LoginScreen**
- Campo email (type: email)
- Campo password (type: password, obscured)
- Botón "Iniciar sesión"
- Loading state mientras valida
- Mensajes de error:
  - Sin red: "Sin conexión. Revisa tu red y vuelve a intentar."
  - Credenciales incorrectas: "Email o contraseña incorrectos."
  - Error temporal: "No se pudo iniciar sesión. Reintenta en unos segundos."

### **ActiveListsScreen**
- LazyColumn con listas
- Cada lista muestra:
  - Título
  - Fecha de última actualización (formato relativo)
- Pull-to-refresh
- Estado vacío: "No tienes listas activas en este momento."
- Banner de red (si está offline)

### **ListDetailScreen**
- LazyColumn con items
- Cada item muestra:
  - Checkbox (izquierda)
  - Thumbnail (si existe, con Coil)
  - Nombre (principal)
  - Precio x Cantidad = Subtotal (si precio existe)
  - Nota (si existe, secundaria)
- **Item checked**:
  - ✅ Checkbox marcado
  - Texto tachado LEVE (no totalmente ilegible)
  - Color gris atenuado
  - Mantener visible y legible
- Bottom bar sticky:
  - "Total: XX.XX €" (suma de checked items)
  - Botón "Completar lista"
- Loading skeleton al cargar

### **ConfirmCompleteDialog**
- Título: "Completar lista"
- Mensaje: "¿Completar la lista? Puedes finalizar aunque queden productos."
- Botones:
  - "Cancelar" (dismissive)
  - "Completar" (primary)

### **Textos SIEMPRE en strings.xml**
- ❌ Cero hardcode de strings
- ✅ Todos los textos en recursos
- Preparado para i18n futuro

---

## 🧪 Testing (TDD Obligatorio)

### **Orden de implementación**
1. **Test primero** (Red)
2. **Implementación mínima** (Green)
3. **Refactor** (si es necesario)

### **Cobertura mínima**
- ✅ Tests unitarios para **todos los casos de uso**
- ✅ Tests de **repositories** (con mocks)
- ✅ Tests de **ViewModels** (estados completos)
- ⚠️ Tests de UI solo para flujos críticos (login, completar)
- ❌ E2E solo si es absolutamente necesario

### **Frameworks**
- JUnit 4/5
- MockK o Mockito
- Coroutines Test
- Turbine (para testing de Flows)

---

## 📊 API Endpoints Usados

### **Auth**
- `POST /api/auth/login` → Login
- `POST /api/auth/refresh` → Refresh token (automático)
- `POST /api/auth/logout` → Logout
- `GET /api/users/me` → Usuario actual (validación)

### **Lists**
- `GET /api/lists?status=ACTIVE` → Listas activas
- `GET /api/lists/{id}` → Detalle con items
- `POST /api/lists/{id}/complete` → Completar lista
- `PATCH /api/lists/{id}/items/{itemId}` → Actualizar item (NOTE: no usado para checks locales)

### **Health**
- `GET /health` → Healthcheck (testing)

---

## 🚫 Lo que NO se Implementa

### **Fuera de scope (solo web)**
- ❌ Registro de usuarios
- ❌ Crear listas
- ❌ Editar título de listas
- ❌ Añadir productos
- ❌ Editar productos
- ❌ Eliminar productos
- ❌ Ver historial completo
- ❌ Duplicar listas
- ❌ Autosave draft
- ❌ Catálogo Mercadona
- ❌ Cambiar estado manualmente (DRAFT ↔ ACTIVE)

### **Features futuras (no ahora)**
- ❌ Login con QR
- ❌ Compartir listas
- ❌ Notificaciones push
- ❌ Dark mode (si no está en diseño)
- ❌ Widgets

---

## 🔧 Decisiones Técnicas Pendientes

### **1. Inyección de dependencias**
**Opciones**:
- **Hilt** (recomendado, estándar Android moderno)
  - ✅ Robusto, compile-safe
  - ✅ Integración nativa con Android
  - ❌ Más setup inicial
- **Koin** (pragmático)
  - ✅ Simple, menos boilerplate
  - ✅ Kotlin-first
  - ❌ Runtime checks
- **Manual** (minimal)
  - ✅ Cero overhead
  - ❌ Más difícil de testear

**Mi recomendación**: **Hilt** (mejor práctica para Clean Architecture)

### **2. TDD strictness**
**Opciones**:
- **TDD estricto**: test → implementación → refactor (lento pero robusto)
- **MVP rápido**: implementar → luego tests (rápido pero riesgoso)

**Mi recomendación**: **TDD estricto** (los documentos lo exigen)

### **3. State management**
**Opciones**:
- **StateFlow + ViewModel** (moderno, reactivo)
- **LiveData** (tradicional)

**Mi recomendación**: **StateFlow** (mejor con Compose)

### **4. Navigation**
**Opciones**:
- **Jetpack Navigation Compose** (oficial)
- **Compose Destinations** (type-safe)

**Mi recomendación**: **Navigation Compose** (suficiente para este proyecto)

---

## ❓ Preguntas para Confirmación

### **1. ¿Qué DI prefieres?**
- [ ] Hilt (robusto, más setup)
- [ ] Koin (simple, pragmático)
- [ ] Manual (minimal overhead)

### **2. ¿Enfoque de testing?**
- [ ] TDD estricto desde el principio
- [ ] MVP funcional rápido, luego tests

### **3. ¿Prioridad máxima?**
- [ ] FASE 0 completa (estructura + dependencias)
- [ ] Auth funcionando YA (estructura mínima)

### **4. ¿Backend listo?**
- [ ] Está corriendo en localhost:3000
- [ ] Necesita configuración adicional

### **5. ¿GitIgnore revisado?**
- [ ] Ya está correcto
- [ ] Revisar ahora

---

## ✅ Lo que Tengo Claro

1. **Arquitectura**: Clean Architecture + MVVM + Feature-first (obligatorio)
2. **Offline-first**: Room + snapshots con merge confirmado
3. **Auth**: Cookies HttpOnly + refresh automático en 401
4. **UI**: Solo consume listas, no las crea/edita
5. **Testing**: TDD obligatorio, cobertura de casos de uso
6. **Textos**: Siempre en strings.xml, cero hardcode
7. **Cambios**: Pequeños, aislados, iterativos
8. **Dependencies**: UI → Domain → Data (unidireccional)

---

## 🚀 Listo para Implementar

Una vez confirmes las **5 preguntas pendientes**, puedo empezar directamente con:

1. **FASE 0**: Setup (dependencias + estructura + DTOs + Room)
2. **FASE 1**: Auth completa (TDD)
3. **FASE 2-7**: Features iterativas

**¿Confirmamos y arrancamos?** 🎯

