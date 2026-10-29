#!/bin/sh
# Serve Kiln on the public internet through a Cloudflare quick tunnel.
#
#   sh scripts/tunnel.sh            # serves http://127.0.0.1:8790
#   PORT=9000 sh scripts/tunnel.sh
#
# A quick tunnel needs no account and no config: cloudflared prints a random
# https://<words>.trycloudflare.com URL and forwards it to the local port.
# The hostname changes every run and the tunnel dies with the process, so this
# is for demos, not for a domain.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8790}"
BIN="${TMPDIR:-/tmp}/cloudflared"

if [ ! -x "$BIN" ]; then
  echo "fetching cloudflared…"
  case "$(uname -m)" in
    x86_64|amd64) ARCH=amd64 ;;
    aarch64|arm64) ARCH=arm64 ;;
    *) echo "unsupported arch: $(uname -m)" >&2; exit 1 ;;
  esac
  curl -fsSL -o "$BIN" \
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$ARCH"
  chmod +x "$BIN"
fi

# The site has to be running first; the tunnel only forwards.
if ! curl -fsS -o /dev/null "http://127.0.0.1:$PORT/health" 2>/dev/null; then
  echo "starting kiln on :$PORT…"
  (cd "$ROOT" && PORT="$PORT" nohup ./bin/kiln app.bun > /tmp/kiln.log 2>&1 &)
  sleep 3
fi

exec "$BIN" tunnel --url "http://127.0.0.1:$PORT" --no-autoupdate
