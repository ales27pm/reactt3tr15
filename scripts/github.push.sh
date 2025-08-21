#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.specialenv/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .specialenv/.env. Aborting." >&2
  exit 1
fi
# shellcheck source=/dev/null
source "$ENV_FILE"

: "${GITHUB_USERNAME:?}" "${GITHUB_REPO:?}" "${GITHUB_TOKEN:?}"

API_URL="https://api.github.com"
REPO_FULL="$GITHUB_USERNAME/$GITHUB_REPO"

# Create repo if it does not exist
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/vnd.github+json" -H "Authorization: token $GITHUB_TOKEN" "$API_URL/repos/$REPO_FULL")
if [[ "$STATUS" == "404" ]]; then
  echo "Creating GitHub repo $REPO_FULL..."
  PRIV=${GITHUB_PRIVATE:-false}
  curl -s -H "Accept: application/vnd.github+json" -H "Authorization: token $GITHUB_TOKEN" \
    -d "{\"name\":\"$GITHUB_REPO\",\"private\":$PRIV}" \
    "$API_URL/user/repos" >/dev/null
fi

cd "$ROOT_DIR"

# Ensure git repo
if [[ ! -d .git ]]; then
  git init
fi

# Default branch main if none
current_branch=$(git branch --show-current || echo "")
if [[ -z "$current_branch" ]]; then
  git checkout -b main
  current_branch="main"
fi

# Add github remote (do not print token)
if git remote get-url github >/dev/null 2>&1; then
  git remote set-url github "https://github.com/$REPO_FULL.git"
else
  git remote add github "https://github.com/$REPO_FULL.git"
fi

echo "Pushing $current_branch to GitHub (github remote)..."
# Use credential helper with PAT via env for this process
GIT_ASKPASS_SCRIPT=$(mktemp)
cat > "$GIT_ASKPASS_SCRIPT" <<'EOF'
#!/usr/bin/env bash
case "$1" in
  *Username*) echo "$GITHUB_USERNAME" ;;
  *Password*) echo "$GITHUB_TOKEN" ;;
  *) echo "" ;;
esac
EOF
chmod +x "$GIT_ASKPASS_SCRIPT"
export GIT_ASKPASS="$GIT_ASKPASS_SCRIPT"
export GITHUB_USERNAME GITHUB_TOKEN

git add -A
if ! git diff --cached --quiet; then
  git commit -m "chore: add GitHub push script and env handling; ignore .specialenv"
fi

git push -u github "$current_branch" || true

# Also push main
if [[ "$current_branch" != "main" ]]; then
  git branch -f main "$current_branch"
  git push github main -f
fi

# Also push feature branch chore/eslint-sfx if exists
if git show-ref --verify --quiet refs/heads/chore/eslint-sfx; then
  git push -u github chore/eslint-sfx || true
fi

rm -f "$GIT_ASKPASS_SCRIPT"
echo "Done. Repo: https://github.com/$REPO_FULL"
