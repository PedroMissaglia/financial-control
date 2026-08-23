#!/usr/bin/env bash
# Garante UTF-8 (CocoaPods) e Xcode completo quando o xcode-select ainda aponta para CLT.
set -euo pipefail
export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"
if [[ -d /Applications/Xcode.app/Contents/Developer ]]; then
  export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
fi
cd "$(dirname "$0")"
exec npx cap "$@"
