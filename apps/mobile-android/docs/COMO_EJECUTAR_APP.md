# 🚀 Cómo Iniciar la App para Probar Health Check

## ✅ Requisitos Previos

Verifica que tengas:
- ✅ Android Studio instalado
- ✅ Android Emulator (crear uno si no existe)
- ✅ Backend corriendo en localhost:3000
- ✅ Gradle sincronizado

---

## 📋 Pasos para Ejecutar

### **PASO 1: Levanta el Backend**

```bash
cd C:\Users\Juan Gines\Desktop\proyectos\shopping-list\apps\api
npm run dev
```

**Output esperado:**
```
> shopping-list-api@1.0.0 dev
> tsx watch src/index.ts

[INFO] Server running on http://localhost:3000
```

**Verifica que funciona:**
```bash
curl http://localhost:3000/health
# Debe responder: {"status":"ok"}
```

---

### **PASO 2: Abre Android Studio**

1. Abre Android Studio
2. Ve a **File → Open**
3. Selecciona: `C:\Users\Juan Gines\Desktop\proyectos\shopping-list\apps\mobile-android`
4. Espera a que sincronice Gradle (puede tardar 2-3 min)

---

### **PASO 3: Levanta el Emulador**

**Opción A: Desde Android Studio**
1. Click en **Device Manager** (icono con teléfono en toolbar derecha)
2. Selecciona un emulador (o crea uno si no existe)
3. Click en el play (▶️) para lanzarlo

**Opción B: Desde Terminal**
```bash
# Listar emuladores disponibles
emulator -list-avds

# Ejecutar uno (ejemplo: Pixel_4_API_31)
emulator -avd Pixel_4_API_31
```

**Espera a que cargue** (puede tardar 1-2 minutos)

---

### **PASO 4: Compila e Instala la App**

**Opción A: Desde Android Studio (MÁS FÁCIL)**
1. Click en el icono de **Play (▶️)** en toolbar superior
   - O usa: `Shift + F10`
2. Selecciona el emulador que está corriendo
3. Espera a que compile (1-2 minutos)
4. La app se abrirá automáticamente

**Opción B: Desde Terminal**
```bash
cd C:\Users\Juan Gines\Desktop\proyectos\shopping-list\apps\mobile-android

# Compilar
.\gradlew.bat assembleDebug

# Instalar en emulador
.\gradlew.bat installDebug

# Ejecutar
.\gradlew.bat installDebug && adb shell am start -n com.alentadev.shopping/.MainActivity
```

---

### **PASO 5: Prueba Health Check**

Una vez que la app esté abierta:

1. **Verás LoginScreen** (porque no has hecho login aún)
   - ⚠️ Es normal, es la pantalla de inicio

2. **Para probar health check manualmente** (sin hacer login):
   - Abre terminal de Android Studio
   - Usa logcat para ver los logs:
   
   ```bash
   adb logcat | findstr "HealthCheck"
   ```

---

### **PASO 6: Prueba Login Completo (Opcional)**

Si quieres probar el **login real**:

1. **Asegurate que el backend está corriendo** (PASO 1)
2. En LoginScreen, ingresa:
   - **Email:** `test@example.com` (o que exista en tu DB)
   - **Password:** `password123` (o la correcta)
3. Toca **"Iniciar Sesión"**

**Deberías ver:**
- ✅ Loading spinner
- ✅ Conexión a http://10.0.2.2:3000/api/auth/login
- ✅ Respuesta exitosa → "Success" state
- ✅ Session guardada en DataStore

---

## 🔧 Troubleshooting

### **Error: "Cannot connect to emulator"**
```bash
# Reinicia el emulator
adb kill-server
adb start-server
```

### **Error: "Connection refused" en la app**
- ❌ Backend NO está corriendo en localhost:3000
- ✅ Solución: Ve a PASO 1 y levanta el backend

### **Error: "Gradle build failed"**
```bash
# Limpia gradle y reinicia
.\gradlew.bat clean
.\gradlew.bat build
```

### **App abre pero se cierra inmediatamente**
- Abre Logcat y busca errores:
  ```bash
  adb logcat | findstr "ERROR"
  ```

### **Emulador muy lento**
- Asegúrate que Hardware Acceleration está enabled
- En Android Studio: **File → Settings → System Settings → Android SDK**
- Tab **SDK Tools** → Verifica que **Android Emulator** está instalado

---

## 📊 URLs Importantes

| Component | URL | Estado |
|-----------|-----|--------|
| Backend | http://localhost:3000 | ✅ Debe estar corriendo |
| Health endpoint | http://localhost:3000/health | ✅ Testea con `curl` |
| App en emulador | Se conecta a http://10.0.2.2:3000 | ✅ Automático (10.0.2.2 = localhost para emulador) |

---

## 🚀 Resumen Rápido

```bash
# Terminal 1: Backend
cd apps/api
npm run dev
# Espera a "Server running on http://localhost:3000"

# Terminal 2: Android Studio
# Abre el proyecto mobile-android en Android Studio
# Click Play (▶️) para compilar y ejecutar en emulador

# Listo: App se abrirá en LoginScreen
```

---

## ✅ Checklist antes de probar

- [ ] Backend corriendo: `curl http://localhost:3000/health` retorna OK
- [ ] Emulador levantado (visible en Device Manager)
- [ ] Android Studio tiene el proyecto abierto
- [ ] Gradle sincronizado (sin errores rojos)
- [ ] Permisos de internet en AndroidManifest.xml ✅
- [ ] networkSecurityConfig permite cleartext a localhost ✅

---

## 💡 Tips Útiles

**Ver logs en tiempo real:**
```bash
adb logcat | findstr "Shopping\|HealthCheck\|TokenAuthenticator\|RetryInterceptor"
```

**Acceder a emulador desde terminal:**
```bash
adb shell
# Luego puedes hacer: ls, cat, etc.
```

**Resetear emulador (si falla):**
```bash
# En Device Manager: click derecho → Wipe Data
```

---

¡Listo! Ahora deberías poder iniciar la app y probar. 🎉

