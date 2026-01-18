# Shopping List MVP

Aplicación web para gestionar listas de la compra personales y compartidas, enfocada inicialmente en Mercadona y pensada para consumo propio o familiar.

El proyecto está construido como un **monolito modular** con **TypeScript**, siguiendo una arquitectura **Vertical Slice + Hexagonal-lite**, priorizando simplicidad, claridad y mantenibilidad a largo plazo.

---

## Objetivo del proyecto

- Crear y gestionar listas de la compra
- Compartir listas con otros usuarios mediante invitación por email
- Añadir productos a las listas (manuales o desde catálogo)
- Integrar el catálogo de Mercadona a través de un provider interno
- Mantener una base de código clara, testeada y fácil de evolucionar

Este proyecto **no es un producto comercial** ni está pensado para escalar masivamente.

---

## Stack tecnológico

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Vitest (tests unitarios)
- Playwright (tests E2E mínimos)

### Backend

- Node.js
- Express
- TypeScript (modo `strict`)
- Validación de inputs con Zod
- Persistencia **in-memory** por defecto con opción de **PostgreSQL**

### Tooling y calidad

- pnpm (monorepo)
- Husky (git hooks)
- ESLint + Prettier
- TDD como metodología principal

---

## Arquitectura (visión general)

### Principios

- Monolito modular
- Organización por **features** (no por capas técnicas globales)
- Dependencias siempre hacia dentro
- Integraciones externas desacopladas mediante interfaces
- Simplicidad por encima de sobreingeniería

## Estructura del proyecto

apps/
├── api/
│ └── src/
│ ├── modules/ # Features backend (auth, lists, invites, catalog…)
│ ├── core/ # Dominio compartido (value objects estables)
│ └── shared/ # Utilidades técnicas transversales
└── web/
└── src/
├── app/ # Bootstrap, routing y providers
├── features/ # Features frontend
└── shared/ # UI y utilidades comunes

---

## Reglas de arquitectura importantes

- Los módulos **no importan internals de otros módulos**
- `core` contiene únicamente value objects y tipos de dominio compartidos
- `shared` contiene solo código técnico, nunca lógica de negocio
- El frontend **no accede directamente** a servicios externos
- Mercadona se integra exclusivamente a través de un **CatalogProvider** en backend
- La API puede operar con repositorios **in-memory** o **PostgreSQL** (según wiring)

---

## Testing

- **TDD obligatorio**
- Backend:
  - Tests de casos de uso
  - Tests de endpoints
- Frontend:
  - Tests unitarios por feature
  - Tests E2E solo para flujos críticos

No se acepta código nuevo sin tests asociados.

---

## Estado del proyecto

Este repositorio proporciona un **scaffold base** preparado para evolucionar de forma incremental.

El foco está en:

- claridad del diseño
- bajo acoplamiento
- mínima complejidad accidental
- facilidad de mantenimiento a largo plazo

---

## Notas finales

Si una solución parece sencilla, probablemente es intencional.  
El objetivo es avanzar sin introducir deuda técnica innecesaria.
