#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -d "$HOME/.local/share/mise/installs/java/21.0.2" ]]; then
  export JAVA_HOME="$HOME/.local/share/mise/installs/java/21.0.2"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

has_android_sdk() {
  if [[ -n "${ANDROID_HOME:-}" && -d "${ANDROID_HOME}" ]]; then
    return 0
  fi

  if [[ -n "${ANDROID_SDK_ROOT:-}" && -d "${ANDROID_SDK_ROOT}" ]]; then
    return 0
  fi

  local properties_file="$ANDROID_DIR/local.properties"
  if [[ -f "$properties_file" ]]; then
    local sdk_dir
    sdk_dir=$(awk -F= '/^sdk\.dir=/{print $2}' "$properties_file" | sed 's/\\\\/:/g')
    if [[ -n "$sdk_dir" && -d "$sdk_dir" ]]; then
      return 0
    fi
  fi

  return 1
}

if ! has_android_sdk; then
  echo "⚠️  Android SDK no configurado. Omitiendo tests de Husky en este entorno."
  exit 0
fi

cd "$ANDROID_DIR"
./gradlew --no-daemon testDebugUnitTest
