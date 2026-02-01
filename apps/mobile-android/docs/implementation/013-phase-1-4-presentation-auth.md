# Fase 1.4 - Presentation Layer (UI + State Management)

## Fecha de Implementación
Próxima fase

## Estado
📋 PENDIENTE

## Objetivo
Implementar la capa de presentación (Presentation Layer) para autenticación con LoginScreen completo en Compose, ViewModel con StateFlow, y navegación integrada.

---

## 📦 Componentes a Implementar

### 1. LoginScreen.kt (Compose UI)
**Ubicación:** `app/src/main/java/com/alentadev/shopping/feature/auth/ui/login/LoginScreen.kt`

UI completa con:
- Email input field (validación en tiempo real)
- Password input field (toggle show/hide)
- Login button (deshabilitado mientras se carga)
- Error messages (toast/snackbar)
- Loading spinner durante request
- "¿Olvidaste tu contraseña?" link (futuro)
- Link a "Registrarse" (futuro)

### 2. LoginViewModel.kt (@HiltViewModel)
**Ubicación:** `app/src/main/java/com/alentadev/shopping/feature/auth/ui/login/LoginViewModel.kt`

ViewModel con:
- `@HiltViewModel` con inyección de `LoginUseCase`
- `StateFlow<LoginUiState>` para estado
- `onEmailChanged(String)`
- `onPasswordChanged(String)`
- `onLoginClicked()`
- Manejo de errores con reintento automático
- Cancelación de coroutines en onCleared()

### 3. LoginUiState.kt (Sealed Class)
**Ubicación:** `app/src/main/java/com/alentadev/shopping/feature/auth/ui/login/LoginUiState.kt`

```kotlin
sealed class LoginUiState {
    object Idle : LoginUiState()
    object Loading : LoginUiState()
    data class Success(val user: User) : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}
```

### 4. LoginNavigation.kt (Rutas)
**Ubicación:** `app/src/main/java/com/alentadev/shopping/feature/auth/ui/navigation/LoginNavigation.kt`

Rutas de navegación:
- `loginRoute`: String = "login"
- Navegación a `ActiveListsScreen` tras login exitoso
- Manejo de back button (no permitir volver de login)

### 5. Strings.xml (Textos)
**Ubicación:** `app/src/main/res/values/strings.xml`

Strings requeridos:
```xml
<string name="app_name">Shopping List</string>
<string name="login_title">Iniciar Sesión</string>
<string name="login_email_hint">Email</string>
<string name="login_password_hint">Contraseña</string>
<string name="login_button">Iniciar Sesión</string>
<string name="login_error_invalid_email">Email inválido</string>
<string name="login_error_empty_password">Contraseña requerida</string>
<string name="login_error_credentials">Credenciales inválidas</string>
<string name="login_error_network">Error de conexión. Reintentando...</string>
<string name="login_error_unknown">Error desconocido. Intenta de nuevo.</string>
<string name="login_loading">Cargando...</string>
```

### 6. Tests de ViewModel
**Ubicación:** `app/src/test/java/com/alentadev/shopping/feature/auth/ui/login/LoginViewModelTest.kt`

Tests:
- `onLoginClicked_withValidCredentials_showsSuccess()`
- `onLoginClicked_withInvalidEmail_showsError()`
- `onLoginClicked_withEmptyPassword_showsError()`
- `onLoginClicked_withNetworkError_showsError()`
- `onEmailChanged_updatesState()`
- `onPasswordChanged_updatesState()`

### 7. Integración con NavGraph
**Ubicación:** `app/src/main/java/com/alentadev/shopping/ui/navigation/NavGraph.kt`

NavGraph actualizado:
- StartDestination = LoginScreen
- Navegación a ActiveListsScreen tras login
- Pop de LoginScreen al salir (logout)
- Backstack management

### 8. Manejo de Back Button
```kotlin
// En LoginScreen
BackHandler(enabled = true) {
    // No permitir back desde login
    // (o navegar a salida si es necesario)
}
```

---

## 🧪 Tests a Implementar

### LoginViewModelTest (8 tests mínimo)
- ✅ Flujo exitoso: login válido → Success
- ✅ Validación: email vacío → Error
- ✅ Validación: password vacío → Error
- ✅ Validación: email formato inválido → Error
- ✅ Error 401: credenciales inválidas → Error
- ✅ Error red: sin conexión → Error con retry
- ✅ Loading state: durante request → Loading
- ✅ Cancel: en onCleared → coroutines canceladas

---

## 🎯 Checklist de Implementación

- [ ] Crear `LoginUiState.kt` (sealed class)
- [ ] Crear `LoginViewModel.kt` (@HiltViewModel)
- [ ] Crear `LoginScreen.kt` (Compose completo)
- [ ] Crear `LoginNavigation.kt` (rutas)
- [ ] Agregar strings a `strings.xml`
- [ ] Crear `LoginViewModelTest.kt` (8 tests)
- [ ] Integrar en `NavGraph.kt`
- [ ] Implementar `BackHandler` para back button
- [ ] Tests PASSING
- [ ] Build SUCCESSFUL

---

## 🔗 Integración con Fases Anteriores

**FASE 1.4 usa:**
- ✅ FASE 1.1: `LoginUseCase` (domain)
- ✅ FASE 1.2: `AuthRepository` (data)
- ✅ FASE 1.3: `RetryInterceptor` + `TokenAuthenticator` (network)

**Flujo Completo:**
```
LoginScreen (UI)
    ↓ user enters credentials
LoginViewModel.onLoginClicked()
    ↓ calls
LoginUseCase.execute(email, password)
    ↓ validates & calls
AuthRepository.login(email, password) [FASE 1.2]
    ↓ calls
AuthRemoteDataSource.login() [con RetryInterceptor + TokenAuthenticator]
    ↓
Result: Session → LoginUiState.Success
    ↓
Navigate to ActiveListsScreen
```

---

## 📊 Métricas Esperadas

| Métrica | Valor |
|---------|-------|
| Archivos nuevos | 5 |
| Líneas de código | ~400 |
| Tests | 8 |
| Coverage | 100% ViewModel |
| Build time | <1m |

---

## 🚀 Próximo Paso después de 1.4

**FASE 2: Listas Activas (CORE - Pantalla principal)**
- GetActiveListsUseCase
- ListsRepository con offline-first
- ActiveListsScreen con LazyColumn
- Refresh UI

---

**Estado:** 📋 PENDIENTE
**Dependencias:** FASE 1.1 ✅, FASE 1.2 ✅, FASE 1.3 ✅
**Bloqueadores:** Ninguno

