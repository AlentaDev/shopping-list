# 🔍 GUÍA DE MONITORIZACIÓN - Problema de conexión

## 📋 Situación actual:
- La app se inicia correctamente
- Al presionar "Probar Endpoint", se queda esperando
- Después de un tiempo, se cierra

## 🎯 Sistema de monitorización mejorado:

He agregado un sistema completo de logging que te permitirá ver exactamente qué está pasando:

### 1. **DebugInterceptor** (nuevo)
- Ubicación: `network/DebugInterceptor.kt`
- Captura TODAS las peticiones HTTP
- Muestra URL, método, headers, duración
- Muestra errores de conexión con stack trace completo

### 2. **RetrofitClient mejorado**
- Usa DebugInterceptor + HttpLoggingInterceptor
- Registra inicialización
- Logs claros de cada paso

### 3. **HealthViewModel mejorado**
- Logs detallados de cada fase
- Captura excepciones con stack trace
- Registra tiempos de espera
- Muestra estado de respuesta (200, 404, 500, etc.)

---

## 🚀 Cómo monitorizar:

### Paso 1: Ejecutar la app en el emulador
```bash
# Abre Android Studio y ejecuta la app
# O desde línea de comandos:
.\gradlew installDebug
```

### Paso 2: Abrir Logcat
En Android Studio:
```
View → Tool Windows → Logcat
```

O desde línea de comandos:
```bash
adb logcat | grep -E "RetrofitClient|HealthCheckScreen|OkHttpDebug|OkHttp"
```

### Paso 3: Filtrar logs importantes
En Logcat, busca por estos tags:
- `RetrofitClient` - Estado de inicialización
- `HealthCheckScreen` - Flujo de la corrutina
- `OkHttpDebug` - Peticiones HTTP (muy detallado)
- `OkHttp` - Logs de OkHttp
- `PersistentCookieJar` - Gestión de cookies

### Paso 4: Presionar el botón y observar

**Esperado:**
```
[RetrofitClient] Inicializando RetrofitClient con URL base: http://10.0.2.2:3000
[RetrofitClient] RetrofitClient inicializado correctamente
[HealthCheckScreen] === INICIANDO VERIFICACIÓN DE SALUD ===
[HealthCheckScreen] Obteniendo ApiService...
[HealthCheckScreen] ApiService obtenido
[HealthCheckScreen] Realizando petición HTTP GET /health...
[OkHttpDebug] ╔════════════════════════════════════════════════════════════════
[OkHttpDebug] ║ REQUEST INICIADO
[OkHttpDebug] ║ URL: http://10.0.2.2:3000/health
[OkHttpDebug] ║ Método: GET
[OkHttpDebug] ╚════════════════════════════════════════════════════════════════
[OkHttpDebug] ╔════════════════════════════════════════════════════════════════
[OkHttpDebug] ║ RESPONSE RECIBIDO
[OkHttpDebug] ║ Status: 200 OK
[OkHttpDebug] ║ Duración: 123ms
[OkHttpDebug] ╚════════════════════════════════════════════════════════════════
[HealthCheckScreen] ✅ Respuesta exitosa: {status=ok, ...}
```

---

## 🔴 Posibles escenarios y soluciones:

### Escenario 1: Se queda esperando sin logs
**Indica**: Problema de inicialización antes de que llegue a hacer la petición
- Revisa si ves logs de `RetrofitClient`
- Si no, el problema está en `MainActivity.onCreate()`

**Solución**: Agrega permisos en AndroidManifest

### Escenario 2: REQUEST INICIADO → se queda esperando → ERROR
**Indica**: La petición sale pero no hay respuesta
- Puede ser problema de red
- O el servidor no está escuchando en localhost:3000

**Solución**: 
```bash
# En tu máquina Windows, verifica que el servidor responde:
curl -v http://localhost:3000/health

# Si funciona localmente, entonces es problema del emulador
# Intenta: netstat -ano | findstr :3000
```

### Escenario 3: ERROR EN REQUEST - "UnknownHostException"
**Indica**: No puede resolver 10.0.2.2
- Problema de DNS
- O la URL está mal configurada

**Solución**: 
- Verifica que `API_BASE_URL` en `build.gradle.kts` es correcto
- Asegúrate de usar `http://10.0.2.2:3000` para emulador

### Escenario 4: ERROR EN REQUEST - "ConnectException"
**Indica**: No puede conectar al host
- El servidor no está corriendo
- O la red no alcanza al servidor

**Solución**: 
- Arranca el servidor en localhost:3000
- Verifica: `curl http://localhost:3000/health`

### Escenario 5: ERROR EN REQUEST - "SocketTimeoutException"
**Indica**: El servidor tarda más de 30 segundos en responder
- Problema de rendimiento del servidor
- O la red es muy lenta

**Solución**: 
- Aumenta timeouts en RetrofitClient
- O optimiza el servidor

---

## 📊 Información que recopilamos:

Una vez que monitorices, copia y pega aquí:

1. **¿Qué logs ves en Logcat?** (Copia los últimos 50 líneas)
2. **¿El servidor responde localmente?** (Resultado de `curl http://localhost:3000/health`)
3. **¿Cuánto tiempo pasa antes del error?** (Está registrado en los logs)
4. **¿Qué tipo de error se muestra?** (ConnectException, TimeoutException, etc.)

---

## 🔧 Comandos útiles:

```bash
# Ver todos los logs
adb logcat

# Ver solo logs de la app
adb logcat | grep shopping

# Ver solo nuestros logs de debug
adb logcat | grep -E "OkHttpDebug|HealthCheckScreen|RetrofitClient"

# Limpiar logcat
adb logcat -c

# Ver en tiempo real
adb logcat -f .\logcat.txt  # Guarda en archivo

# Conectar a emulador
adb connect emulator-5554

# Ver procesos
adb shell ps | grep shopping
```

---

## ✅ Checklist:

- [ ] La app se inicia sin crash
- [ ] Logcat está abierto y mostrando logs
- [ ] Presiono el botón "Probar Endpoint"
- [ ] Veo logs en tiempo real
- [ ] Copié el error exacto que aparece
- [ ] El servidor está corriendo en localhost:3000
- [ ] `curl http://localhost:3000/health` funciona en Windows

¡Ejecuta la app, abre Logcat, presiona el botón y dime qué logs ves! 🚀

