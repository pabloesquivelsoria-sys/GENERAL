#!/bin/bash
# Primera inicializacion del contenedor Postgres: roles y bases (bbs, traccar, metabase).
# Las contrasenas llegan como variables de entorno del servicio db (ver docker-compose.yml).
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v bbs_pw="${BBS_DB_PASSWORD:?}" -v ro_pw="${BBS_READONLY_PASSWORD:?}" \
  -v traccar_pw="${TRACCAR_DB_PASSWORD:?}" -v metabase_pw="${METABASE_DB_PASSWORD:?}" <<'SQL'
-- roles (las contrasenas se pasan como variables psql, no se interpolan en shell)
CREATE ROLE bbs          LOGIN PASSWORD :'bbs_pw';       -- dueno del esquema; usado por la API
CREATE ROLE bbs_readonly LOGIN PASSWORD :'ro_pw';        -- Grafana / Metabase: solo esquema bi
CREATE ROLE traccar      LOGIN PASSWORD :'traccar_pw';
CREATE ROLE metabase     LOGIN PASSWORD :'metabase_pw';

CREATE DATABASE bbs      OWNER bbs;
CREATE DATABASE traccar  OWNER traccar;
CREATE DATABASE metabase OWNER metabase;

-- bbs_readonly no debe poder usar el esquema operativo
REVOKE ALL ON DATABASE bbs FROM PUBLIC;
GRANT CONNECT ON DATABASE bbs TO bbs, bbs_readonly;
SQL
