# Fase 1.3 - Network Integration & Cleanup

## Estado
✅ COMPLETADO

## Cambios Realizados

### 1. RetryInterceptor con Backoff Exponencial ✅

**Archivo Creado:** `app/src/main/java/com/alentadev/shopping/core/network/RetryInterceptor.kt`

Interceptor que reintenta requests fallidas con estrategia:
- Max 3 intentos
- Backoff exponencial: 1s, 2s, 4s
- Solo reintenta en errores de red (IOException)
- No reintenta en 4xx/5xx del servidor

```kotlin
class RetryInterceptor : Interceptor {
    // 3 intentos con delay exponencial
    // Catch IOException y reintenta
    // Manejo de loops infinitos
}
```

### 2. Integración en NetworkModule ✅

**Archivo Modificado:** `app/src/main/java/com/alentadev/shopping/core/network/di/NetworkModule.kt`

- Agregar importación de `RetryInterceptor`
- Crear provider Hilt: `provideRetryInterceptor()`
- Inyectar en `provideOkHttpClient()` como primer interceptor

Orden de interceptors:
1. **RetryInterceptor** (reintentos con backoff)
2. **DebugInterceptor** (logging detallado)
3. **HttpLoggingInterceptor** (logging HTTP)

### 3. Eliminar Código Legacy (Red Vieja) ✅

**Eliminado:** Carpeta completa `app/src/main/java/com/alentadev/shopping/network/`

Razón: Duplicación innecesaria
- Versión vieja: sin Hilt, acoplada
- Versión nueva: con Hilt (core/network/), desacoplada
- Mantenimiento de una sola versión según arquitectura pactada

**Archivos Eliminados:**
- `network/RetrofitClient.kt` (singleton manual)
- `network/TokenAuthenticator.kt` (viejo)
- `network/DebugInterceptor.kt` (duplicado)
- `network/PersistentCookieJar.kt` (duplicado)
- `network/ApiService.kt` (duplicado)
- `network/ApiUrlManager.kt` (código muerto)

### 4. Actualizar HealthCheckScreen a Hilt ✅

**Archivo Modificado:** `app/src/main/java/com/alentadev/shopping/ui/screens/HealthCheckScreen.kt`

Cambios:
- Eliminar import de `RetrofitClient`
- Agregar `@HiltViewModel` a `HealthViewModel`
- Inyectar `ApiService` en constructor
- Cambiar de `viewModel()` a `hiltViewModel()` en Compose
- Actualizar DTOs: `Map<String, String>` → `HealthStatus`
- Acceso a campo: `state.response.status` en lugar de `state.response["status"]`

### 5. Agregar hilt-navigation-compose ✅

**Archivo Modificado:** `app/build.gradle.kts`

```gradle
implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
```

Necesario para `@HiltViewModel` y `hiltViewModel()` en Compose.

### 6. Unificar TokenAuthenticator ✅

**Archivos:**
- Mantener: `app/src/main/java/com/alentadev/shopping/core/network/TokenAuthenticator.kt`
- Eliminar: `app/src/main/java/com/alentadev/shopping/network/TokenAuthenticator.kt` (eliminado con carpeta network/)

**Implementación Mejorada:**
```kotlin
class TokenAuthenticator : Authenticator {
    - Refresh automático en 401
    - Crear new OkHttpClient para refresh (evita recursión)
    - Reintento seguro: máx 2 intentos
    - Evitar loop infinito con check de path
    - Limpiar cookies si falla refresh
}
```

---

## Alineación con Arquitectura Pactada (AGENTS.md)

✅ **Feature-first:** Solo una versión de cada componente en `core/network/`
✅ **DI con Hilt:** Todos los clientes usan `NetworkModule`
✅ **Clean Architecture:** No hay RetrofitClient singleton, solo inyección
✅ **Separación de capas:** UI inyecta ApiService, no lo crea manualmente

---

## Tests Creados

### RetryInterceptorTest ✅
- `succeeds on first attempt`
- `fails after max retries on IOException`

**Ubicación:** `app/src/test/java/com/alentadev/shopping/core/network/RetryInterceptorTest.kt`

---

## Cambios en DTOs

### HealthStatus

```kotlin
@Serializable
data class HealthStatus(
    val status: String
)
```

Ahora `ApiService.getHealth()` retorna `Response<HealthStatus>` (limpio).

---

## Dependencias Agregadas

```gradle.kts
implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
```

---

## State de Build

**Antes:**
- ❌ 2 versiones de TokenAuthenticator
- ❌ RetrofitClient singleton
- ❌ HealthCheckScreen usando RetrofitClient manual
- ❌ Sin retry en errores de red

**Después:**
- ✅ 1 versión de TokenAuthenticator (core)
- ✅ Solo Hilt injection
- ✅ HealthCheckScreen usa @HiltViewModel
- ✅ RetryInterceptor con backoff automático
- ✅ Build SUCCESSFUL ✅

---

## Próximo Paso: FASE 1.5

Implementar UI Layer completo (LoginScreen + Presentation State Management)

---

**Rama Actual:** `feature/android-auth-flow`
**Build Status:** ✅ SUCCESSFUL
**Tests:** 25+ tests PASSING (auth domain + data + network)

