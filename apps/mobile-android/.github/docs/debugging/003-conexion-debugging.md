# 🔧 Guía de Debugging - Conexión a API

## ✅ Lo que ya está configurado

1. **Red Security Config** ✅
   - Archivo: `app/src/main/res/xml/network_security_config.xml`
   - Permite HTTP en desarrollo para:
     - `10.0.2.2` (localhost en emulador)
     - `localhost`
     - `127.0.0.1`

2. **Permisos en AndroidManifest** ✅
   - `android.permission.INTERNET`
   - `android.permission.ACCESS_NETWORK_STATE`

3. **Logging Mejorado** ✅
   - RetrofitClient ahora registra todos los detalles en Logcat
   - HealthCheckScreen captura stack traces completos
   - Los errores se muestran en la UI con detalles técnicos

## 🎯 Pruebas a realizar

### 1. **Verificar que el servidor está corriendo**
```bash
# En tu máquina Windows, verifica que la API está en localhost:3000
curl http://localhost:3000/health
```

### 2. **Ejecutar en Emulador Android**
```bash
# Asegúrate de usar la URL correcta para el emulador:
# http://10.0.2.2:3000
# 
# 10.0.2.2 = localhost de la máquina host desde el emulador
```

### 3. **Revisar Logcat**
Abre Android Studio y ve a:
- **View → Tool Windows → Logcat**
- Busca por: `RetrofitClient` o `HealthCheckScreen`
- Verás logs como:
  - "Inicializando RetrofitClient con URL base: http://10.0.2.2:3000"
  - Logs de HTTP request/response
  - Stack traces de errores

### 4. **Posibles problemas y soluciones**

#### Problema: "Connection refused" o "Unable to resolve host"
- **Causa**: El servidor no está ejecutándose o la URL es incorrecta
- **Solución**:
  ```bash
  # Verifica que el servidor está corriendo
  netstat -ano | findstr ":3000"  # Windows
  # O en otra terminal ejecuta tu servidor
  npm start  # o el comando para tu backend
  ```

#### Problema: "Network security policy prohibits cleartext traffic"
- **Causa**: El network_security_config.xml no está siendo usado
- **Solución**:
  - Verifica que está en `app/src/main/res/xml/`
  - Verifica que AndroidManifest.xml tiene:
    ```xml
    android:networkSecurityConfig="@xml/network_security_config"
    ```
  - Reconstruye la app: `gradlew clean build`

#### Problema: "ConnectTimeout" o "SocketTimeoutException"
- **Causa**: El servidor tarda mucho en responder (30s timeout)
- **Solución**:
  - Verifica que la API está respondiendo rápidamente
  - Puede ser un problema de red en el emulador

#### Problema: Error 5xx desde el servidor
- **Causa**: El endpoint `/health` existe pero tiene un error
- **Solución**: Revisa los logs del servidor

### 5. **Debugging paso a paso**

1. **Ejecuta la app en el emulador**
2. **Abre Logcat en Android Studio**
3. **Presiona el botón "Probar Endpoint"**
4. **Observa el flujo:**
   - ✅ Deberías ver "Inicializando RetrofitClient..."
   - ✅ Verás logs de la petición HTTP
   - ✅ O verás el error detallado en la UI

### 6. **Modificar URL de forma temporal**

Si quieres probar con una URL diferente, edita:
- `app/build.gradle.kts` 
- En el bloque `defaultConfig`:
  ```kotlin
  buildConfigField("String", "API_BASE_URL", "\"http://TU_IP:3000\"")
  ```
- Luego ejecuta: `gradlew clean assembleDebug`

## 📋 Checklist de conexión

- [ ] Servidor ejecutándose en localhost:3000
- [ ] Endpoint `/health` disponible en el servidor
- [ ] App compilada correctamente
- [ ] Emulador configurado
- [ ] Permisos de INTERNET en AndroidManifest ✅
- [ ] network_security_config.xml configurado ✅
- [ ] URL correcta: `http://10.0.2.2:3000` para emulador
- [ ] Revisa Logcat para detalles del error
- [ ] El error se muestra en la UI con stack trace

## 🔍 Archivos relevantes

- **Configuración de red**: `app/src/main/res/xml/network_security_config.xml`
- **Permisos**: `app/src/main/AndroidManifest.xml`
- **Cliente HTTP**: `app/src/main/java/com/alentadev/shopping/network/RetrofitClient.kt`
- **Pantalla de test**: `app/src/main/java/com/alentadev/shopping/ui/screens/HealthCheckScreen.kt`
- **Configuración**: `app/build.gradle.kts` (API_BASE_URL)

¡La app ahora está lista para debugguear la conexión! 🚀

