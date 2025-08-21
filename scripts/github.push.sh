#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"
if [ ! -f "$ROOT_DIR/.specialenv/.env" ]; then echo ".specialenv/.env missing" >&2; exit 1; fi
set -a; . "$ROOT_DIR/.specialenv/.env"; set +a
if [ -z "${GITHUB_TOKEN:-}" ] || [ -z "${GITHUB_USERNAME:-}" ] || [ -z "${GITHUB_REPO:-}" ]; then echo "Missing GitHub env vars" >&2; exit 1; fi
# Set remote fresh
(git remote remove origin >/dev/null 2>&1) || true
git remote add origin "https://github.com/$GITHUB_USERNAME/$GITHUB_REPO.git"
# Ensure main branch
git branch -M main
# Push using ephemeral header (does not store token)
git -c http.extraheader="AUTHORIZATION: bearer $GITHUB_TOKEN" push -u origin main
