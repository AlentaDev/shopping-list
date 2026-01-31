# 🔧 SOLUCIÓN: Pantalla de Configuración de API

## ❌ Problema identificado:

```
SocketTimeoutException: failed to connect to /10.0.2.2 (port 3000) after 30000ms
```

**Causa**: El emulador no puede alcanzar `10.0.2.2:3000`

Esto puede ocurrir por:
- El servidor no está corriendo en localhost:3000
- El firewall bloquea la conexión
- La dirección 10.0.2.2 no funciona en tu configuración
- La red del emulador está mal configurada

---

## ✅ SOLUCIÓN IMPLEMENTADA:

He agregado una **Pantalla de Configuración de API** que permite cambiar la URL dinámicamente:

### 🆕 Archivos creados:

1. **ApiConfigScreen.kt** - Pantalla de configuración con:
   - Botones rápidos para opciones comunes
   - Campo de entrada personalizado
   - Tips útiles

2. **ApiUrlManager.kt** - Gestor de URL que guarda la preferencia en DataStore

### 🔄 Cambios en MainActivity:

- Ahora tiene un botón de ⚙️ (Settings) en la barra superior
- Puedes alternar entre Health Check y Configuración
- La URL se guarda automáticamente

---

## 🚀 CÓMO USAR:

### 1. **Ejecutar la app**
```bash
.\gradlew installDebug
# O desde Android Studio: Run → Run 'app'
```

### 2. **Presionar el ⚙️ (Settings) arriba a la derecha**

### 3. **Elegir una opción:**

**Opción A: Botones rápidos**
- "Emulador (10.0.2.2)" → `http://10.0.2.2:3000`
- "Localhost" → `http://localhost:3000`
- "127.0.0.1" → `http://127.0.0.1:3000`

**Opción B: URL personalizada**
- Escribe una URL custom (ej: `http://192.168.1.100:3000`)
- Presiona "Guardar URL"

### 4. **Volver a Health Check**
- Presiona ⚙️ de nuevo o el botón atrás
- Presiona "Probar Endpoint"

---

## 💡 RECOMENDACIONES:

### Si estás en el emulador con Windows:

**Primero, verifica que tu servidor está corriendo:**
```bash
# En cmd/PowerShell
curl http://localhost:3000/health

# Si funciona, deberías ver una respuesta
```

**Si funciona localmente pero no desde el emulador, intenta:**

1. **Obtener tu IP de red:**
   ```bash
   ipconfig
   # Busca "IPv4 Address" (ej: 192.168.1.100)
   ```

2. **Asegurar que el firewall permite la conexión:**
   - Abre Windows Defender Firewall
   - Permite la app o el puerto 3000

3. **Usar esa IP en la app:**
   - Abre configuración (⚙️)
   - Escribe: `http://192.168.1.100:3000`
   - Guarda

4. **Prueba el endpoint**

---

## 🎯 OPCIONES A INTENTAR (en orden):

### 1️⃣ **`http://10.0.2.2:3000`** (por defecto)
- ✅ Mejor opción para emulador Android estándar
- ❌ Falla si la red está mal configurada

### 2️⃣ **`http://localhost:3000`**
- ✅ A veces funciona si el emulador está configurado correctamente
- ❌ No siempre funciona

### 3️⃣ **`http://TU_IP_LOCAL:3000`** (ej: `http://192.168.1.100:3000`)
- ✅ Funciona si el firewall lo permite
- ✅ Más confiable que 10.0.2.2
- ⚠️ Requiere obtener tu IP local

### 4️⃣ **Dispositivo físico conectado con ADB**
- ✅ Funciona igual que el emulador
- ℹ️ Asegúrate de estar en la misma red

---

## 🔍 DEBUGGING:

**Si sigue sin funcionar:**

1. Abre Logcat
2. Filtra por: `RetrofitClient`, `OkHttpDebug`
3. Copia el error exacto
4. Verifica que tu servidor responde:
   ```bash
   curl -v http://localhost:3000/health
   ```

---

## 📊 FLUJO DE LA APP AHORA:

```
┌─────────────────────────────┐
│  APP INICIA                 │
│      ↓                      │
│  ⚙️ SETTINGS                 │
│  (Botón arriba a la derecha)│
│      ↓                      │
│  CAMBIAS URL                │
│      ↓                      │
│  VUELVES A HEALTH CHECK     │
│      ↓                      │
│  PRUEBAS ENDPOINT           │
│      ↓                      │
│  ✅ CONEXIÓN EXITOSA        │
│  o ❌ ERROR con detalles    │
└─────────────────────────────┘
```

---

## ✅ CHECKLIST:

- [ ] La app compila correctamente (BUILD SUCCESSFUL)
- [ ] Ejecuto la app en el emulador
- [ ] Abro el botón de ⚙️
- [ ] Intento diferentes URLs
- [ ] Mi servidor está corriendo en localhost:3000
- [ ] `curl http://localhost:3000/health` funciona en mi máquina

¡Ahora deberías poder conectarte probando diferentes URLs! 🚀

## RESUELTO: El emulador puede alcanzar el servidor backend exitosamente.

- He tenido que cambiar la ip de conexion en la API a 0.0.0.0 para que acepte conexiones externas.


