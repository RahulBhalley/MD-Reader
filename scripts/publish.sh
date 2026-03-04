#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# publish.sh — Build and publish a new MD-Reader release to GitHub.
#
# Usage:
#   export GITHUB_TOKEN=ghp_your_token_here
#   ./scripts/publish.sh
#
# The script will:
#   1. Verify GITHUB_TOKEN is set
#   2. Print the version being released
#   3. Run `electron-forge publish` (builds + uploads artifacts to GitHub)
# -----------------------------------------------------------------------------

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

# ── Helpers ───────────────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}[info]${NC}  $*"; }
success() { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC}  $*"; }
error()   { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

# ── Resolve repo root ─────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# ── 1. Check GITHUB_TOKEN is set ──────────────────────────────────────────────
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  error "GITHUB_TOKEN is not set.\n\n  Create a token at https://github.com/settings/tokens (needs 'repo' scope)\n  then run:\n\n    export GITHUB_TOKEN=ghp_your_token_here\n    ./scripts/publish.sh"
fi

# ── 2. Validate the token against GitHub API (fail fast before build) ─────────
info "Validating GITHUB_TOKEN with GitHub API…"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user)

if [[ "$HTTP_STATUS" != "200" ]]; then
  error "GitHub token validation failed (HTTP $HTTP_STATUS).\n\n  Make sure your token:\n    • Is not expired\n    • Has the 'repo' scope checked\n\n  Create a new one at: https://github.com/settings/tokens/new?scopes=repo"
fi

success "GITHUB_TOKEN is valid."

# ── 3. Show version ───────────────────────────────────────────────────────────
VERSION=$(node -p "require('./package.json').version")
info "Publishing version: ${YELLOW}v${VERSION}${NC}"

# ── 4. Confirm ────────────────────────────────────────────────────────────────
echo ""
warn "This will build the app and upload a DRAFT release to GitHub."
warn "You will need to manually publish the draft at:"
warn "  https://github.com/RahulBhalley/MD-Reader/releases"
echo ""
read -r -p "Continue? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  info "Aborted."
  exit 0
fi

# ── 5. Publish ────────────────────────────────────────────────────────────────
echo ""
info "Running electron-forge publish…"
npm run publish

echo ""
success "Done! Review and publish your draft release at:"
success "  https://github.com/RahulBhalley/MD-Reader/releases"
