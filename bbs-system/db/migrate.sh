#!/usr/bin/env bash
# Aplica db/migrations/*.sql y db/seeds/*.sql en orden. Uso: DATABASE_URL=... ./db/migrate.sh [--seed]
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
: "${DATABASE_URL:?DATABASE_URL requerido}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())"
apply() {
  for f in "$DIR/$1"/*.sql; do
    n="$1/$(basename "$f")"
    if [ "$(psql "$DATABASE_URL" -tAc "SELECT 1 FROM schema_migrations WHERE name='$n'")" = "1" ]; then continue; fi
    echo "applying $n"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q --single-transaction -f "$f" -c "INSERT INTO schema_migrations(name) VALUES ('$n')"
  done
}
apply migrations
[ "${1:-}" = "--seed" ] && apply seeds
echo done
