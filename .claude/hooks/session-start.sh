#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs npm dependencies so lint/build/dev are runnable from the first turn.
set -euo pipefail

# Only run in remote (web) sessions; local checkouts manage their own deps.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# Skip the install when node_modules already matches the current lockfile, so a
# cached container starts instantly; reinstall whenever the lockfile changes.
stamp="node_modules/.claude-deps-lock-hash"
want=$(sha256sum package-lock.json | cut -d' ' -f1)

if [ -f "$stamp" ] && [ "$(cat "$stamp")" = "$want" ]; then
  echo "dependencies already up to date"
else
  # npm ci, not npm install: it installs exactly the lockfile and never rewrites
  # it. npm install rewrites package-lock.json under this npm version (it drops
  # "peer" metadata), which would leave the working tree dirty every session.
  npm ci --no-audit --no-fund
  echo "$want" > "$stamp"
fi

# Vite needs these at build time; the repo ships a committed .env, but keep the
# session working even if it is ever removed.
if [ ! -f .env ]; then
  echo "warning: no .env found - VITE_SUPABASE_* vars are unset, build will produce a non-functional client" >&2
fi
