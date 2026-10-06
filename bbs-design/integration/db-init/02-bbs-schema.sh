#!/bin/bash
# Aplica las migraciones (y opcionalmente los seeds) de bbs-system/db sobre la base 'bbs'
# como el rol 'bbs' (dueno de los objetos). Registra en schema_migrations con el mismo
# formato que bbs-system/db/migrate.sh, de modo que ese script pueda continuar despues.
set -euo pipefail
export PGPASSWORD="${BBS_DB_PASSWORD:?}"
# durante la inicializacion el servidor solo escucha en socket unix: se conecta por socket
PSQL=(psql -v ON_ERROR_STOP=1 -q --username bbs --dbname bbs)

"${PSQL[@]}" -c "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())"

apply_dir() {
  local dir="$1"
  [ -d "/bbs-sql/$dir" ] || { echo "WARN: /bbs-sql/$dir no esta montado; omitido"; return 0; }
  for f in /bbs-sql/"$dir"/*.sql; do
    local n="$dir/$(basename "$f")"
    echo "applying $n"
    "${PSQL[@]}" --single-transaction -f "$f" -c "INSERT INTO schema_migrations(name) VALUES ('$n')"
  done
}

apply_dir migrations
if [ "${BBS_LOAD_SEEDS:-true}" = "true" ]; then apply_dir seeds; fi
