---
name: android-adb-wsl
description: "Trigger: adb, Android emulator, emulador Android, WSL, Windows, captura de pantalla. Verificar y usar el emulador de Windows desde WSL de forma segura."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Usa esta skill para inspeccionar o verificar una app Android ejecutada en un emulador de Windows desde WSL.

## Hard Rules

- Un `adb` de Linux sin dispositivos no demuestra que el emulador de Windows esté detenido.
- Una ruta de otra sesión es una pista, no una autorización vigente ni una ubicación garantizada. Pide permiso antes de ejecutar un archivo fuera del proyecto.
- Selecciona explícitamente el dispositivo con `-s`; confirma su identidad si hay varios.
- No cambies red, estado de la app ni datos del usuario sin autorización para esa acción. No expongas información sensible de capturas o logs.
- No afirmes que verificaste interacción, reconexión o cambios visuales solo porque una captura funcionó.

## Decision Gates

| Situación | Acción |
|---|---|
| `adb devices -l` en WSL no muestra el emulador | Consulta el ADB de Windows; no cambies la configuración de red por defecto |
| Ruta de Windows desconocida | Pide al usuario `adb version` y `adb devices -l` en PowerShell |
| Ejecutable externo autorizado y accesible | Invoca `adb.exe` desde WSL con su ruta entre comillas |
| Dispositivo inaccesible o permiso ausente | Informa el bloqueo; no supongas acceso |

## Execution Steps

1. Identifica el emulador con `adb.exe devices -l`. Como antecedente, funcionó `/mnt/c/Users/Juan Gines/AppData/Local/Android/Sdk/platform-tools/adb.exe` con `emulator-5554`; verifica ambos en cada entorno.
2. Para una captura autorizada, ejecuta `adb.exe -s <serial> exec-out screencap -p` redirigiendo la salida a un archivo temporal dentro del proyecto. Lee la imagen y elimina tu archivo temporal después.
3. Para interactuar cuando esté autorizado, se verificó `adb.exe -s <serial> shell input tap <x> <y>` y `adb.exe -s <serial> shell input keyevent KEYCODE_BACK`; captura de nuevo para observar el resultado. Las coordenadas dependen del dispositivo y la pantalla.
4. Antes de actualizar una instalación existente, compara su firma con la del APK nuevo; una firma distinta impide la actualización. No desinstales ni borres datos. En este entorno, la firma de WSL difirió de la de Windows; el usuario pudo ejecutar la app desde Android Studio en Windows.
5. Para pruebas instrumentadas, usá una copia temporal del proyecto con `applicationId` y `testApplicationId` distintos de la app del usuario. Verifica ambos IDs y el `targetPackage` del test con `aapt` antes de instalar; aborta ante cualquier discrepancia. Se verificó la ejecución de `ItemCardInstrumentedTest` con `adb.exe -s <serial> shell am instrument -w -r -e class <clase> <testApplicationId>/androidx.test.runner.AndroidJUnitRunner`: seis tests pasaron y el paquete original siguió instalado. No uses `connectedLocalDebugAndroidTest` contra la app habitual.
6. Simula desconexión solo dentro del alcance autorizado y restaura el estado de conectividad modificado. Informa qué observaste y qué verificaciones no realizaste.

## Output Contract

Indica dispositivo, método, evidencia observada y bloqueos o verificaciones pendientes.

## References

- `skills/android-kotlin/SKILL.md`
- `apps/mobile-android/AGENTS.md`
