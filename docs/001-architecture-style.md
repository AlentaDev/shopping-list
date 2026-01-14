# ADR-0001: Estilo de arquitectura del proyecto

## Estado

Aceptado

## Contexto

El proyecto consiste en una aplicación web para gestionar listas de la compra personales y compartidas, con:

- Frontend en React + TypeScript
- Backend en Node.js + Express
- Integración con un catálogo externo (Mercadona)
- Autenticación y permisos por lista
- Uso principalmente personal o familiar
- Prioridad en simplicidad, mantenibilidad y TDD
- Sin requisitos de escalado masivo ni alta disponibilidad

Se buscaba una arquitectura que:

- Permita avanzar rápido sin generar deuda innecesaria
- Mantenga las responsabilidades bien separadas
- Evite acoplamientos fuertes con integraciones externas
- Sea comprensible en el tiempo por una sola persona

---

## Decisión

Se adopta una arquitectura **Monolito Modular** basada en:

- **Vertical Slice Architecture** (organización por features)
- **Hexagonal / Ports & Adapters (versión lite)** para integraciones externas
- TypeScript en modo estricto
- TDD como metodología obligatoria

La estructura se divide principalmente en:

- `modules/` para features de negocio
- `core/` para dominio compartido (value objects estables)
- `shared/` para utilidades técnicas transversales

El frontend sigue el mismo enfoque de organización por features.

---

## Justificación

Esta arquitectura permite:

- Mantener el proyecto como un único deploy (simplicidad operativa)
- Aislar claramente la lógica de negocio por feature
- Proteger el core del dominio frente a detalles de infraestructura
- Integrar Mercadona como un provider intercambiable
- Escribir tests de casos de uso sin depender de Express, DB o APIs externas
- Evolucionar el proyecto sin necesidad de reestructurarlo constantemente

La versión “lite” evita caer en una Clean Architecture excesivamente ceremoniosa.

---

## Alternativas consideradas y descartadas

### 1. MVC clásico (routes → controllers → services → models)

**Motivo de descarte:**

- Tiende a mezclar lógica de negocio, validación e infraestructura
- Los servicios acaban convirtiéndose en “god objects”
- Difícil aislar integraciones externas como Mercadona
- Permisos y reglas duplicadas en múltiples capas

---

### 2. Clean Architecture / Hexagonal pura

**Motivo de descarte:**

- Demasiada ceremonia para el tamaño y objetivo del proyecto
- Incrementa el número de archivos y abstracciones innecesarias
- Penaliza la velocidad inicial sin aportar beneficios claros a corto plazo

Se adopta solo el **concepto**, no la implementación estricta.

---

### 3. Microservicios

**Motivo de descarte:**

- Overkill para un proyecto personal/familiar
- Incrementa drásticamente la complejidad operativa
- Requiere observabilidad, despliegue y comunicación entre servicios
- No aporta valor real al caso de uso

---

### 4. Serverless (funciones por endpoint)

**Motivo de descarte:**

- Dificulta el manejo de integraciones externas frágiles
- Complica el uso de cache, rate limiting y lógica compartida
- Peor experiencia de debugging y testing
- No encaja bien con un provider externo como Mercadona

---

### 5. Frontend-only + APIs externas directas

**Motivo de descarte:**

- Exposición directa de integraciones externas
- Imposibilidad de aplicar cache, control de errores y fallback
- Riesgos de seguridad y mantenimiento
- Dificulta tests y evolución futura

---

## Consecuencias

### Positivas

- Código más claro y modular
- Tests más sencillos y fiables
- Integraciones desacopladas
- Menor deuda técnica
- Arquitectura comprensible a largo plazo

### Negativas

- Ligera sobrecarga inicial en estructura
- Necesidad de disciplina en imports y límites entre módulos

Estas consecuencias se consideran aceptables dado el objetivo del proyecto.

---

## Mensajes de la API

Para mantener consistencia y evitar strings mágicos en la API:

- Todos los mensajes (validación, errores de dominio y respuestas de API) deben vivir en `apps/api/src/shared/constants/`.
- Crear un archivo por feature (`authMessages.ts`, `usersMessages.ts`, etc.).
- Los mensajes genéricos de la API (por ejemplo, errores comunes) deben ir en un archivo separado (`apiErrorMessages.ts`).
- No introducir mensajes inline en servicios, routers o value objects.

---

## Notas

Si en el futuro el proyecto creciera significativamente (más usuarios, monetización, equipos), esta arquitectura permitiría:

- Extraer servicios de forma progresiva
- Sustituir providers sin reescribir el core
- Reorganizar sin grandes refactors

Por ahora, la prioridad es **claridad y progreso sostenido**.
