#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-run}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"
pkill -f "$ROOT_DIR/node_modules/electron" >/dev/null 2>&1 || true
npm run check

case "$MODE" in
  run)
    npm start >/tmp/elemental-browser.log 2>&1 &
    ;;
  --debug|debug)
    npx electron --inspect=9229 .
    ;;
  --logs|logs)
    npm start >/tmp/elemental-browser.log 2>&1 &
    tail -f /tmp/elemental-browser.log
    ;;
  --telemetry|telemetry)
    npm start >/tmp/elemental-browser.log 2>&1 &
    /usr/bin/log stream --info --style compact --predicate 'process == "Elemental"'
    ;;
  --verify|verify)
    npm start >/tmp/elemental-browser.log 2>&1 &
    sleep 2
    pgrep -f "$ROOT_DIR/node_modules/electron" >/dev/null
    ;;
  *)
    echo "usage: $0 [run|--debug|--logs|--telemetry|--verify]" >&2
    exit 2
    ;;
esac
