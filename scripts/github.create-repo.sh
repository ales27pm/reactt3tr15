#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ ! -f "$ROOT_DIR/.specialenv/.env" ]; then echo ".specialenv/.env missing" >&2; exit 1; fi
set -a; . "$ROOT_DIR/.specialenv/.env"; set +a
if [ -z "${GITHUB_TOKEN:-}" ] || [ -z "${GITHUB_USERNAME:-}" ] || [ -z "${GITHUB_REPO:-}" ]; then echo "Missing GitHub env vars" >&2; exit 1; fi
# Check if repo exists
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/repos/$GITHUB_USERNAME/$GITHUB_REPO)
if [ "$HTTP" = "200" ]; then
  echo "Repo $GITHUB_USERNAME/$GITHUB_REPO exists; skipping creation"
  exit 0
fi
# Create repo (private)
curl -sS \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -X POST https://api.github.com/user/repos \
  -d '{"name":"'"$GITHUB_REPO"'","private":true,"auto_init":false}'
echo "Created repo $GITHUB_USERNAME/$GITHUB_REPO"
