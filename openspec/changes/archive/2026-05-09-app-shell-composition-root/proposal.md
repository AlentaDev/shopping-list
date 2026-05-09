# Proposal: App Shell Composition Root

## Intent

Formalizar `src/app-shell/*` como composition root del frontend para resolver el conflicto de reglas arquitectónicas (aislamiento de features vs. orquestación cross-feature), manteniendo comportamiento actual sin cambios funcionales.

## Scope

### In Scope
- Definir reglas explícitas de límites/dependencias entre `app-shell`, `features`, `context`, `providers` y `shared`.
- Consolidar una única implementación canónica en `apps/web/src/app-shell/*`.
- Migrar imports/tests para eliminar ambigüedad con `apps/web/src/features/app-shell/*`.
- Retirar árbol duplicado `features/app-shell` al final de la migración incremental.

### Out of Scope
- Cambios de UX, navegación, flujos de negocio o contratos API.
- Refactors de features no relacionadas.
- Cambios en estrategia global de testing 100/80/0.

## Capabilities

### New Capabilities
- `app-shell-composition-root`: Capa de composición de aplicación fuera de módulos de negocio, con reglas de dependencia explícitas y rol de orquestación global.

### Modified Capabilities
- None.

## Approach

Migración en slices pequeños y reversibles:
1) documentar/establecer reglas de frontera,
2) converger runtime e imports a `@src/app-shell/*`,
3) alinear tests de composición,
4) eliminar duplicados cuando todo esté verde.

## Dependency & Boundary Rules

- `features/*` MUST NOT importar `features/*` de otra feature.
- `features/*` MUST NOT importar `app-shell/*`.
- `app-shell/*` MAY importar `features/*`, `context/*`, `shared/*`.
- `app-shell/*` MUST NOT contener reglas de negocio ni adapters DTO de una feature.
- `providers/*` MUST NOT importar internals de `features/*` ni de `app-shell/*`.
- `App.tsx` SHOULD limitarse a componer `AppShell`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/App.tsx` | Modified | Entrypoint del shell, sin lógica de negocio. |
| `apps/web/src/app-shell/*` | Modified | Composición/orquestación canónica. |
| `apps/web/src/features/app-shell/*` | Removed | Eliminación progresiva de duplicados. |
| `apps/web/src/App.test.tsx` y `apps/web/src/features/app-shell/*.test.tsx` | Modified | Alinear tests/imports a ruta canónica. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Roturas de import durante cleanup | Med | Migrar por slices con tests por paso. |
| Reintroducción de límites ambiguos | Med | Reglas explícitas en specs + revisión PR. |
| `AppShell` demasiado grande | Low | Segmentar orquestación en helpers/hooks. |

## Rollback Plan

Revertir el slice más reciente (imports/tests/cleanup), mantener temporalmente `features/app-shell` como fallback y restaurar alias/rutas previas hasta estabilizar.

## Dependencies

- Artefacto de exploración validado (`sdd/app-shell-composition-root/explore`).
- Aprobación de reglas de frontera para pasar a `sdd-spec`.

## Success Criteria

- [ ] Existe un único app-shell canónico en `apps/web/src/app-shell/*`.
- [ ] Reglas de dependencia quedan especificadas para `app-shell` vs `features`.
- [ ] Comportamiento funcional observable permanece equivalente.
- [ ] Tests de composición e imports quedan alineados sin referencias al árbol duplicado.
