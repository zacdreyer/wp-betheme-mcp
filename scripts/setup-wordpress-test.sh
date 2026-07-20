#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WP_DIR="$ROOT_DIR/tests/fixtures/wordpress"

mkdir -p "$WP_DIR"
cat > "$WP_DIR/README.md" <<'EOF'
This directory is reserved for a local WordPress integration environment.
It is intentionally not populated by default so the repository remains lightweight.
EOF

echo "WordPress test harness scaffold created at $WP_DIR"
