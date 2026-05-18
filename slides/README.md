# Shopping List — Presentación del proyecto (lectura autónoma)

## 1. Qué es este proyecto

**Shopping List** es una app para planificar la compra en Mercadona desde casa,
con soporte web, API y Android.

Está pensada para evitar listas en papel caóticas y dar más control antes y después de comprar.

---

## 2. El problema real que resuelve

- Cuando llevo lista a lápiz, suele quedar desordenada.
- Me olvido de productos importantes.
- A veces compro cosas que ya tenía.
- No tengo claro cuánto voy a gastar antes de ir.

Este proyecto convierte esa experiencia en un flujo ordenado y trazable.

---

## 3. Cómo nació el proyecto

Desde el inicio la idea fue clara: **web + API + consumo Android**.

- **Web** para preparar la compra con calma desde el PC.
- **API** para reglas de negocio, sesión y persistencia.
- **Android** para usar la lista en contexto real de supermercado.

Se eligió arquitectura modular para poder crecer sin reescribir todo.

---

## 4. Alcance actual del catálogo

Hoy el catálogo consumido es **solo de Mercadona**.

- Las listas se construyen sobre productos de ese supermercado.
- La app está enfocada en ese caso de uso de punta a punta.

Diseño preparado para incorporar otros supermercados más adelante.

---

## 5. Cómo funciona (visión general)

1. El usuario debe estar registrado e iniciar sesión.
2. Explora productos de Mercadona desde web.
3. Agrega productos y confecciona una lista en estado **borrador** (`DRAFT`).
4. El borrador se **autoguarda** en API y navegador para no perder el progreso/sesión.
5. Para usar la lista en compra real, se finaliza desde el detalle del borrador y pasa a **`ACTIVE`**.
6. Al activar la lista, el borrador se resetea para poder empezar una nueva lista.
7. Android consume listas activas para uso en tienda.

---

## 6. Flujo de uso real (antes de ir al súper)

1. Desde casa, reviso catálogo y selecciono productos.
2. Organizo cantidades y prioridades dentro del borrador (`DRAFT`).
3. El sistema autoguarda continuamente para no perder cambios.
4. En el detalle del borrador, finalizo la lista y pasa a `ACTIVE`.
5. Veo una estimación del coste total.
6. Salgo a comprar con una lista clara y utilizable en móvil.

Resultado: menos olvidos, menos compra impulsiva, mejor planificación.

---

## 7. Flujo de uso real (durante y después)

- En el supermercado, uso la lista activa desde Android.
- Marco avances y completo la compra.
- Queda historial de listas/compras para revisar gasto con el tiempo.

También se puede **reusar una lista `COMPLETED`** del historial:

1. Se copia al borrador (`DRAFT`).
2. Se ajusta a gusto (añadir, borrar o retocar productos/cantidades).
3. Al finalizar, se convierte en una **nueva lista `ACTIVE`**.

Esto permite mejorar decisiones de compra semana a semana.

---

## 8. Reglas clave del sistema

- Estados de lista controlados (`DRAFT`, `ACTIVE`, `COMPLETED`).
- Bloqueo de edición concurrente cuando corresponde (`409 list_editing_locked`).
- Snapshots de categoría para mantener consistencia de agrupación en el tiempo.
- Reutilización de listas `COMPLETED` hacia `DRAFT` para acelerar compras repetidas sin perder flexibilidad.

---

## 9. Qué aporta al usuario

- Compra más ordenada.
- Menos olvidos.
- Menos duplicados.
- Estimación económica previa.
- Historial útil para controlar gasto en Mercadona.

Aunque nació por una necesidad personal, puede aportar valor a otros usuarios con el mismo problema.

---

## 10. Evolución prevista

- Mantener foco en calidad del flujo actual.
- Mejorar análisis de gasto/hábitos.
- Extender la arquitectura a nuevos supermercados sin romper lo existente.

---

## 11. Despliegue real y comportamiento esperado

- Web desplegada en **Vercel**.
- API desplegada en **Render**.
- Base de datos PostgreSQL gestionada en **Neon**.
- Observabilidad con **Sentry** en web, API y Android.
- Guardrails en **GitHub Actions** para push/PR/versionado.
- Despliegue automático en web y API.
- Android **semi-manual**: guardrails/versionado automáticos, build y publicación manual.

Importante para revisión:

- En Render free, la API puede entrar en reposo por inactividad.
- Al abrir la web tras un rato sin uso, el catálogo puede tardar ~30–90 segundos en aparecer mientras Render “despierta” la API.
- Este comportamiento es esperado en ese entorno.

---

## 12. Android: descarga e instalación

- La app Android se descarga directamente desde la web en la ruta `/app`.
- Desde ahí se accede a la APK beta actual y se instala en el teléfono.

---

## 13. Referencias del proyecto

- `README.md` (instalación, stack y estructura técnica)
- `docs/features/web/`
- `docs/features/api/`
- `apps/mobile-android/docs/use-cases/`
