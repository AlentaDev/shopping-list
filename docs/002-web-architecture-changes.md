# ADR-0002: Cambios aprobados en la arquitectura web

⚠️ Este documento define la arquitectura objetivo del frontend.
⚠️ El estado actual del código puede no cumplirla aún.
⚠️ La migración es incremental.

## Estado

Aceptado

## Contexto

La aplicación web en `apps/web` necesita una estructura más clara y consistente para separar
la lógica de datos de la UI, organizar el código por features y definir un espacio compartido
con responsabilidades explícitas. Se acordó una guía de organización que refuerza el enfoque
feature-first y evita mezclar lógica de negocio en componentes UI o utilidades compartidas.

---

## Decisión

Se aprueba la siguiente arquitectura web:

- La app web vive en `apps/web`.
- El código UI se organiza **feature-first** en `apps/web/src/features`.
  - Cada feature puede tener `components/`, sus tests y un `index.ts`.
- Los contextos globales viven en `apps/web/src/app/context`:
  - `CartContext*`, `ToastContext*`, `useCart`, `useToast` e `index.ts`.
- El módulo `apps/web/src/shared` se reserva para utilidades y componentes reutilizables,
  con esta estructura establecida:
  - `components/` (Skeleton, Toast y tests)
  - `constants/` (businessRules, ui)
  - `data/` (products)
  - `hooks/` (index)
  - `strategies/` (estrategias de descuento y tests)
  - `types/` (index)
  - `utils/` (cálculos, formato, validaciones y tests)

---

## Justificación

Esta estructura:

- Mantiene el enfoque modular por feature y evita acoplamientos entre features.
- Reduce la mezcla de lógica de datos con componentes UI.
- Centraliza utilidades compartidas sin introducir lógica de negocio en `shared`.
- Deja los contextos globales en un lugar predecible y consistente.

---

## Alternativas consideradas y descartadas

### 1. Ubicar los contextos dentro de `shared/`

**Motivo de descarte:**

- `shared/` queda reservado para utilidades y componentes reutilizables, no para
  infraestructura de estado global.

---

### 2. Distribuir contextos dentro de cada feature

**Motivo de descarte:**

- Se busca que los contextos globales vivan en un único punto para consumo transversal
  y evitar duplicación.

---

## Consecuencias

### Positivas

- Mayor claridad al ubicar responsabilidades por carpeta.
- Mejor separación entre UI, datos y utilidades compartidas.
- Facilita el crecimiento de features sin reestructurar la app.

### Negativas

- Requiere disciplina para mantener la estructura acordada.

---

## Notas

Este documento recoge únicamente los cambios acordados para la arquitectura web. La migración
progresiva de la base de código se realizará en iteraciones futuras.
