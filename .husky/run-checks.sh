#!/usr/bin/env bash
set -euo pipefail

HOOK_TYPE="${1:-pre-commit}"

run_cmd() {
  local cmd="$1"

  if [ "${HUSKY_DRY_RUN:-0}" = "1" ]; then
    echo "[DRY RUN] $cmd"
    return 0
  fi

  eval "$cmd"
}

run_optional_gga() {
  if [ "${HUSKY_GGA:-0}" != "1" ]; then
    return 0
  fi

  echo "🛡️ Ejecutando GGA local bajo demanda..."
  echo "───────────────────────────────────────────────────────"
  run_cmd "gga run"
}

changed_files_for_hook() {
  if [ -n "${HUSKY_CHANGED_FILES:-}" ]; then
    printf "%s\n" "$HUSKY_CHANGED_FILES"
    return
  fi

  if [ "$HOOK_TYPE" = "pre-commit" ]; then
    git diff --name-only --cached
    return
  fi

  local upstream_ref
  upstream_ref="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"

  if [ -n "$upstream_ref" ]; then
    git diff --name-only "$upstream_ref"...HEAD
    return
  fi

  git diff --name-only HEAD
}

is_android_only_change() {
  local files="$1"

  if [ -z "$files" ]; then
    return 1
  fi

  while IFS= read -r file; do
    [ -z "$file" ] && continue

    case "$file" in
      apps/mobile-android/*)
        ;;
      *)
        return 1
        ;;
    esac
  done <<< "$files"

  return 0
}

run_android_checks() {
  echo "🤖 Ejecutando tests de Android..."
  echo "───────────────────────────────────────────────────────"
  run_cmd "pnpm test:android"
}

run_global_checks() {
  if [ "$HOOK_TYPE" = "pre-commit" ]; then
    echo "🔍 Ejecutando: Linting + TypeCheck + Tests Unitarios..."
    echo "───────────────────────────────────────────────────────"
    run_cmd "pnpm quality"
    return
  fi

  echo "📋 Paso 1/3: Linting + TypeCheck + Tests Unitarios..."
  echo "───────────────────────────────────────────────────────"
  run_cmd "pnpm quality"
  echo "✅ Quality pasado"
  echo ""

  echo "🎭 Paso 2/3: Tests E2E..."
  echo "───────────────────────────────────────────────────────"
  run_cmd "pnpm test:e2e"
  echo "✅ E2E tests pasados"
  echo ""

  echo "🔨 Paso 3/3: Build..."
  echo "───────────────────────────────────────────────────────"
  run_cmd "pnpm -r build"
  echo "✅ Build exitoso"
}

main() {
  run_optional_gga

  if [ "${HUSKY_FULL_CHECKS:-0}" != "1" ]; then
    echo "ℹ️ Checks pesados omitidos. Usá HUSKY_FULL_CHECKS=1 para ejecutarlos localmente."
    return
  fi

  local changed_files
  changed_files="$(changed_files_for_hook)"

  if is_android_only_change "$changed_files"; then
    echo "📱 Cambios detectados solo en Android."
    run_android_checks
    return
  fi

  echo "🌐 Cambios detectados fuera de Android. Ejecutando checks globales."
  run_global_checks
}

main
