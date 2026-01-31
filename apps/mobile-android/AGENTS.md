# Reglas del Agente IA (Mobile Android)

Este documento aplica a **apps/mobile-android/** y define reglas estrictas
para trabajar en la app móvil con Android Studio.

---

## Objetivo

Construir una app móvil **robusta y simple**, alineada con la arquitectura del
monolito modular, usando **TDD** y cambios pequeños.

---

## Reglas generales

- No inventar requisitos ni funcionalidades.
- No introducir librerías nuevas sin justificar y pedir confirmación.
- No cambiar la arquitectura sin confirmación explícita.
- Priorizar soluciones simples y explícitas.
- Evitar refactors masivos o innecesarios.
- Si una decisión no está documentada, **preguntar antes de implementar**.

---

## Metodología

- **TDD obligatorio**: test primero → implementación mínima → refactor.
- Cambios pequeños y aislados.
- Una feature o caso de uso por iteración.

---

## Arquitectura móvil (obligatoria)

- **Clean Architecture + MVVM**.
- Organización por **features** (feature-first).
- Capas sugeridas por feature:
  - `ui/`: Composición UI (Compose/Views) y estados de pantalla.
  - `domain/`: entidades + casos de uso (sin dependencias Android).
  - `data/`: repositorios y fuentes de datos (remote/local).
  - `data/remote/`: cliente HTTP, DTOs, mappers.
  - `data/local/`: almacenamiento de snapshots offline.

**Dependencias permitidas**: UI → Domain → Data. Nunca al revés.

---

## Reglas de dependencias

- `domain/` **no** depende de Android framework.
- `ui/` **no** hace requests directos; consume casos de uso.
- `data/` encapsula red y almacenamiento local.
- Nada de lógica de negocio en capas de infraestructura.

---

## UI y textos

- No hardcode de textos. Usar `strings.xml` o recursos equivalentes.
- Mantener mensajes consistentes y reutilizables.

---

## Testing

- Tests unitarios para **domain** y lógica crítica.
- Tests de UI solo para flujos críticos.
- Evitar E2E salvo flujos indispensables.

---

## Documentación obligatoria

- Toda feature nueva debe documentarse en `docs/use-cases/`.
- Los cambios deben reflejarse en `docs/architecture.md` si afectan arquitectura.

---

## Contexto del producto (resumen)

- La app consume **listas activas** creadas en la web.
- Login obligatorio con cuenta creada en web.
- Uso **offline-first** dentro de supermercado, con snapshots.
- Sin historial en móvil (solo web, por ahora).
