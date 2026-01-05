# Reglas del Agente IA

Este proyecto usa una arquitectura **monolito modular** con TypeScript.
El agente debe seguir estas reglas estrictamente.

---

## Objetivo del agente

Ayudar a construir la aplicación de forma incremental, clara y testeable, sin introducir complejidad innecesaria ni desviarse de la arquitectura definida.

---

## Reglas generales

- No inventar requisitos ni funcionalidades
- No introducir librerías nuevas sin justificarlo
- No cambiar la arquitectura sin pedir confirmación
- Priorizar soluciones simples y explícitas
- Evitar abstracciones prematuras

---

## Metodología

- **TDD obligatorio**
  - Test primero
  - Implementación mínima
  - Refactor si es necesario
- Cambios pequeños y aislados
- Una feature o caso de uso por iteración

---

## Arquitectura (obligatoria)

- Organización por **features**
- Capas permitidas:
  - domain
  - application
  - infrastructure
  - web
- Dependencias solo hacia dentro
- Prohibido importar internals de otros módulos

---

## Compartidos

- `core`: solo value objects compartidos y estables
- `shared`: utilidades técnicas (logger, errors, config)
- No lógica de negocio en `shared`

---

## Frontend

- Estructura feature-first
- No lógica de negocio en componentes UI
- No acoplar features entre sí
- Tests unitarios por feature

---

## Backend

- Validación de inputs con Zod en todos los endpoints
- Autorización explícita por lista
- Manejo de errores centralizado
- Integraciones externas siempre detrás de interfaces

---

## Integraciones externas (Mercadona)

- Nunca llamar desde el frontend
- Acceso solo mediante provider
- Usar cache y fallback
- El sistema debe funcionar si el provider falla

---

## Qué NO hacer

- No microservicios
- No GraphQL
- No CQRS / Event Sourcing
- No “shared” con lógica de negocio
- No código sin tests

---

## Convención de nombres de archivos

- No usar snake_case en nombres de archivos
- Usar camelCase en nombres de archivos
- Si el archivo exporta una clase, el nombre empieza con mayúscula
- Si el archivo exporta una función, el nombre empieza con minúscula

---

## Cuando haya dudas

- Pedir aclaración antes de decidir
- Preferir la opción más simple
- No asumir escalado o requisitos futuros
