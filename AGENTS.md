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

## Frontend — Arquitectura objetivo (contrato)

La siguiente arquitectura define el **modelo canónico del frontend**.

⚠️ El código existente puede no cumplir aún esta estructura.  
⚠️ Todo código nuevo **DEBE** seguir estas reglas.

### Estructura base

features/
└─ <feature-name>/
   ├─ components/        # UI específica de la feature
   ├─ services/
   │  ├─ adapters/       # Acceso a backend (fetch, endpoints, mapping)
   │  │  ├─ *Adapter.ts
   │  │  └─ *Adapter.test.ts
   │  ├─ *Service.ts     # Lógica de orquestación de la feature
   │  └─ *Service.test.ts
   ├─ <Feature>.tsx
   └─ index.ts

### Reglas estrictas (frontend)

- **components/**
  - Solo UI
  - No `fetch`
  - No lógica de negocio
  - Solo consumen `services`

- **services/**
  - Orquestan casos de uso del frontend
  - Transforman datos para UI
  - Usan `adapters` y `shared`
  - No acceden directamente al DOM

- **adapters/**
  - Único lugar donde se permite `fetch`
  - Encapsulan endpoints, errores y mapping
  - No contienen lógica de UI
  - No conocen componentes

- **shared/**
  - Código puro y reutilizable
  - Sin `fetch`
  - Sin estado global
  - Sin conocimiento de features concretas

🚫 Prohibido:

- `components` → `adapters`
- `shared` → `adapters`
- una feature importando otra feature

---

## Estado global (frontend)

- Los contextos globales viven en `apps/web/src/app/context`
- Solo para estado transversal de UI (cart, toast, modals)
- No lógica de negocio
- No llamadas a backend

---

## Backend

- Validación de inputs con Zod en todos los endpoints
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

## Convenciones de nombres

- Carpetas: **kebab-case**
- Archivos:
  - Componentes React: **PascalCase.tsx**
  - Hooks React: **camelCase con prefijo `use`** (`useCart.ts`)
  - Clases (services, adapters, strategies): **PascalCase.ts**
  - Utilidades / funciones puras: **camelCase.ts**
- Componentes React: **PascalCase**
- Clases: **PascalCase**
- Funciones: **camelCase**
- Tipos e interfaces: **PascalCase**
- Constantes: **UPPER_SNAKE_CASE**

🚫 Prohibido:

- `snake_case` en carpetas o archivos
- `kebab-case` en archivos `.ts/.tsx`
- `camelCase` en componentes React

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

- Pedir aclaración antes de decidir
- Preferir la opción más simple
- No asumir escalado ni requisitos futuros
