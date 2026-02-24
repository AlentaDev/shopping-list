#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -d "$HOME/.local/share/mise/installs/java/21.0.2" ]]; then
  export JAVA_HOME="$HOME/.local/share/mise/installs/java/21.0.2"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

cd "$ANDROID_DIR"

./gradlew --no-daemon testDebugUnitTest
