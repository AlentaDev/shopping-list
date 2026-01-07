# Reglas del Agente IA

Este proyecto usa una arquitectura **monolito modular** con TypeScript.
El agente debe seguir estas reglas estrictamente.

---

## Objetivo del agente

Ayudar a construir la aplicación de forma incremental, clara y testeable,
sin introducir complejidad innecesaria ni desviarse de la arquitectura definida.

Este documento actúa como **contrato obligatorio** para cualquier cambio.

---

## Reglas generales

- No inventar requisitos ni funcionalidades
- No introducir librerías nuevas sin justificarlo y pedir confirmación
- No cambiar la arquitectura sin pedir confirmación explícita
- Priorizar soluciones simples y explícitas
- Evitar abstracciones prematuras
- Si una decisión no está documentada, **preguntar antes de implementar**
- Evitar refactors masivos: no mover/renombrar más de ~10 archivos por iteración sin confirmación

---

## Metodología

- **TDD obligatorio**
  - Test primero
  - Implementación mínima
  - Refactor solo después de verde
- Cambios pequeños y aislados
- Una feature o caso de uso por iteración

---

## Arquitectura global (obligatoria)

- Organización por **features**
- Capas permitidas (backend):
  - domain
  - application
  - infrastructure
  - web
- Dependencias solo hacia dentro
- Prohibido importar internals de otros módulos

---

## Compartidos (backend)

- `core`: solo value objects compartidos y estables
- `shared`: utilidades técnicas (errors, middleware, config)
- **Nunca** lógica de negocio en `shared`

---

## Frontend — Arquitectura (contrato)

⚠️ El código existente puede no cumplir aún esta estructura.  
⚠️ Todo código nuevo **DEBE** seguir estas reglas.  
⚠️ Los principios generales del proyecto aplican también al frontend.

### Estructura base (frontend)

```txt
apps/web/src/
├─ context/
├─ features/
├─ infrastructure/
├─ providers/
└─ shared/
```

### Dentro de cada feature

```text
features/<feature>/
├─ components/
├─ services/
│ └─ adapters/
└─ index.ts
```

---

## Responsabilidades estrictas (frontend)

### context/

- Estado global transversal de UI (cart, toast, modals…)
- Sin `fetch`
- Sin lógica de negocio de features

### `features/<feature>/components/`

- UI pura (presentación)
- Sin `fetch`
- Sin orquestación de casos de uso
- Solo consumen `services/`

### `features/<feature>/services/`

- Orquestación de casos de uso del frontend
- **Aquí sí se permite `fetch`**
- Decide endpoints/parámetros/reintentos
- Usa adapters para transformar datos externos
- No contiene componentes UI

### `features/<feature>/services/adapters/`

- Transformación de datos externos (DTO) → dominio del frontend
- Normalización de estructuras/formatos
- Funciones puras y testeables
- **Nunca** realiza `fetch`
- No importa React, no accede a window, no depende de UI

### shared/

- Código reutilizable y puro
- Sin `fetch`
- Sin estado global
- Sin conocimiento de features concretas
- Si algo es específico de una feature, no va en shared

### providers/ e infrastructure/

- `providers/`: composición de providers (AppProviders)
- `infrastructure/`: infra transversal (ej. sentry, boundaries)
- No lógica de negocio de features

---

## Reglas de dependencias (frontend)

🚫 Prohibido:

- `components/` → usar `fetch` o llamar a endpoints
- `components/` → importar desde `services/adapters/` directamente
- `shared/` → usar `fetch` o depender de features
- `features/*` → importar otra feature (solo vía `shared/` o `context/` cuando aplique)

---

## Convenciones de nombres (frontend)

- Carpetas: **kebab-case**
- Archivos:
  - Componentes React: **PascalCase.tsx**
  - Hooks React: **useX.ts**
  - Clases (services, adapters, strategies): **PascalCase.ts**
  - Utilidades / funciones puras: **camelCase.ts**
- Tipos e interfaces: **PascalCase**
- Constantes: **UPPER_SNAKE_CASE**

---

## Backend

- Validar variables de entorno al arrancar la API (fail fast).
- Validar inputs de endpoints con Zod.
- Autorización explícita por lista/recurso
- Manejo de errores centralizado
- Integraciones externas siempre detrás de interfaces
- Persistencia actual **in-memory** (sin DB)

---

## Integraciones externas (Mercadona)

- Nunca llamar desde el frontend
- Acceso solo mediante provider en backend
- Usar cache y fallback
- El sistema debe seguir funcionando si el provider falla

---

## Qué NO hacer

- No microservicios
- No GraphQL
- No CQRS / Event Sourcing
- No lógica de negocio en `shared`
- No código sin tests
- No mover código existente “por limpieza” sin necesidad

---

## Documentación de features

- Para cada feature nueva, crear un `.md` conciso
- Features web → `/docs/features/web`
- Features api → `/docs/features/api`
- Documentar:
  - objetivo
  - endpoints (si aplica)
  - reglas importantes
  - notas de implementación

---

## Cuando haya dudas

- Detener implementación
- Pedir aclaración
- Elegir siempre la opción más simple
