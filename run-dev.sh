#!/usr/bin/env bash
set -euo pipefail

export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

cd "$(dirname "$0")"
bun run dev -- --host 0.0.0.0 --port 3000
