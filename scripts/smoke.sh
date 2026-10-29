#!/usr/bin/env bash
# A short end-to-end check of the site against a running server.
#
#   ./scripts/smoke.sh [base-url]
#
# It starts its own server on port 8791 unless BASE is given, so it never
# disturbs a page you have open.

set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${1:-}"
STARTED=""

pass=0
fail=0

ok() {
    pass=$((pass + 1))
    printf '  ok    %s\n' "$1"
}

bad() {
    fail=$((fail + 1))
    printf '  FAIL  %s\n' "$1"
}

check() {
    # check <name> <expected> <actual>
    if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (expected $2, got $3)"; fi
}

if [ -z "$BASE" ]; then
    PORT=8791
    BASE="http://127.0.0.1:$PORT"
    ( cd "$ROOT" && PORT=$PORT ./bin/kiln app.bun > /tmp/kiln-smoke.log 2>&1 & echo $! > /tmp/kiln-smoke.pid )
    STARTED=1
    for _ in $(seq 1 100); do
        code=$(curl -s -o /dev/null -w '%{http_code}' -m 1 "$BASE/health" 2>/dev/null)
        [ "$code" = "200" ] && break
        sleep 0.1
    done
fi

echo "kiln — smoke test against $BASE"

code=$(curl -s -o /tmp/kiln-home.html -w '%{http_code}' "$BASE/")
check "the page answers 200" "200" "$code"

grep -q 'Run the whole plant' /tmp/kiln-home.html && ok "the hero headline is there" || bad "hero headline missing"
grep -q 'class="cap"' /tmp/kiln-home.html && ok "the six capability tabs render" || bad "capability tabs missing"
check "six datasets ship with the page" "6" "$(grep -o 'class="dataset"' /tmp/kiln-home.html | wc -l | tr -d ' ')"
check "the product rail has four entries" "4" "$(grep -o 'class="rail-item' /tmp/kiln-home.html | wc -l | tr -d ' ')"
check "the industry tabs have six entries" "6" "$(grep -o 'data-industry="' /tmp/kiln-home.html | wc -l | tr -d ' ')"
grep -q '<svg class="iso"' /tmp/kiln-home.html && ok "the diagrams are drawn inline" || bad "no inline diagrams"

# The tables are rendered from the content module, not shipped as a blob.
grep -q 'KX-3380' /tmp/kiln-home.html && ok "catalogue rows are server-rendered" || bad "catalogue rows missing"
grep -q 'SPS Commerce' /tmp/kiln-home.html && ok "the integrations table is server-rendered" || bad "integrations rows missing"

# Static assets, with the right types.
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/assets/app.css")
check "the stylesheet is served" "200" "$code"
ctype=$(curl -s -o /dev/null -w '%{content_type}' "$BASE/assets/app.css")
check "the stylesheet has a CSS type" "text/css; charset=utf-8" "$ctype"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/assets/app.js")
check "the script is served" "200" "$code"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/assets/mark.svg")
check "the favicon is served" "200" "$code"

# A byte-length check: the page is not ASCII, so Content-Length has to count
# bytes, not characters.
bytes=$(curl -s "$BASE/" | wc -c | tr -d ' ')
header=$(curl -s -D - -o /dev/null "$BASE/" | tr -d '\r' | awk 'tolower($1)=="content-length:"{print $2}')
check "Content-Length counts bytes" "$bytes" "$header"

# The one endpoint.
body=$(curl -s -X POST "$BASE/api/demo" -H 'content-type: application/json' -d '{"email":"ops@northwind.example"}')
echo "$body" | grep -q '"ok": *true' && ok "a valid email is accepted" || bad "valid email rejected: $body"
code=$(curl -s -o /tmp/kiln-bad.json -w '%{http_code}' -X POST "$BASE/api/demo" -H 'content-type: application/json' -d '{"email":"nope"}')
check "a malformed email is refused" "400" "$code"
grep -q 'domain' /tmp/kiln-bad.json && ok "the refusal names the problem" || bad "refusal message is vague"

# Unknown paths and methods.
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/nope")
check "an unknown path is a 404" "404" "$code"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/demo")
check "GET on the form endpoint is a 405" "405" "$code"

if [ -n "$STARTED" ] && [ -f /tmp/kiln-smoke.pid ]; then
    kill "$(cat /tmp/kiln-smoke.pid)" 2>/dev/null
    rm -f /tmp/kiln-smoke.pid
fi

echo
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
