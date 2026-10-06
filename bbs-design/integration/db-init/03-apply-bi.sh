#!/bin/bash
# Crea el esquema bi (vistas de solo lectura + permisos de bbs_readonly) sobre la base 'bbs'.
# El .sql vive en sql/ para que el entrypoint de Postgres no lo ejecute solo contra la base 'postgres'.
set -euo pipefail
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname bbs -f /docker-entrypoint-initdb.d/sql/bi-schema.sql
