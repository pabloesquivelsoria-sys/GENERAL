# BBS - Diseno e integraciones

Sistema de seguimiento Behavior-Based Safety (EHS). Backend en `../bbs-system` (NestJS + PostgreSQL + Redis, prefijo `/api/v1`).

## Indice

| Documento | Contenido |
|---|---|
| [ARQUITECTURA.md](ARQUITECTURA.md) | Componentes, flujos (Observacion -> Alerta -> CAPA -> Verificacion), decisiones |
| [UX.md](UX.md) | Navegacion, wireframes, flujo de captura movil, tablero CAPA, propuesta de frontend React |
| [INTEGRACIONES.md](INTEGRACIONES.md) | Traccar, email, WhatsApp, Slack, SSO, BI, importacion Excel, webhooks salientes |
| [openapi.yaml](openapi.yaml) | Contrato OpenAPI 3.0.3 (43 operaciones); `x-implementation` indica `implemented` o `planned` |
| [integration/](integration/) | Entorno de referencia con Docker Compose |

**Fuente de verdad:** el esquema SQL (`bbs-system/db/migrations`) y los controllers/DTOs de la API. Donde los documentos de diseno difieren, manda `openapi.yaml`:

- Estado CAPA: `open, in_progress, verification, closed, cancelled` (no existen `pending_verification` ni `reopened`; una verificacion no efectiva devuelve a `in_progress`; `closed` solo por `POST /capa/{id}/verifications`).
- JSON en `snake_case` (columnas SQL), paginacion `page`/`limit` con `meta {page, limit, total, pages}`, login devuelve `access_token` (sin refresh token), rutas `/kpi/*`, `/auth/users`, `/observations/catalog`.
- Roles: `admin, ehs_manager, site_manager, supervisor, observer, capa_owner, viewer`.

## Brechas conocidas (no implementadas en la API actual)

- `POST /webhooks/traccar` y `/webhook-subscriptions` estan en el contrato (`planned`) pero sin codigo. `near_misses` no tiene columnas `source` ni lat/lng, y `observations` no tiene `client_id`; el near-miss automatico de Traccar y la sincronizacion offline idempotente requieren una migracion nueva.
- Sin adjuntos (la tabla `attachments` existe), refresh token, SSO, importacion Excel ni CRUD de `escalation_rules`.

## Entorno de integracion

Requisitos: Docker con Compose v2.

```bash
cd integration
cp .env.example .env            # ajustar secretos si no es solo desarrollo
docker compose up -d            # db, redis, traccar, grafana, mailhog
docker compose --profile bi up -d       # + Metabase
docker compose --profile full up -d --build   # + API NestJS (../bbs-system/api)
```

| Servicio | URL | Notas |
|---|---|---|
| API (perfil `full`) | http://localhost:3000/api/v1 | El primer `POST /auth/register` crea el admin |
| Grafana | http://localhost:3001 | `admin` / `admin`; dashboard "BBS - KPIs" ya provisionado (carpeta BBS) |
| Traccar | http://localhost:8082 | Crear el admin al primer acceso; app Traccar Client -> puerto 5055 |
| Mailhog | http://localhost:8025 | SMTP `localhost:1025` |
| Metabase (perfil `bi`) | http://localhost:3002 | Agregar PostgreSQL: host `db`, base `bbs`, usuario `bbs_readonly` |
| PostgreSQL | localhost:5432 | Bases `bbs`, `traccar`, `metabase` |

Que hace la primera inicializacion de `db` (`integration/db-init/`, solo con volumen vacio):

1. `01-roles-databases.sh`: roles `bbs`, `bbs_readonly`, `traccar`, `metabase` y sus bases.
2. `02-bbs-schema.sh`: aplica `bbs-system/db/migrations` y `seeds` (desactivable con `BBS_LOAD_SEEDS=false`).
3. `03-apply-bi.sh`: crea el esquema `bi` (vistas `v_observations`, `v_near_misses`, `v_capa`, `v_alerts`, `v_safe_behavior_daily`, ...) y deja a `bbs_readonly` con acceso solo a `bi`.

Para reiniciar desde cero: `docker compose down -v`.

Traccar -> BBS: configurar en Traccar una notificacion de tipo Web para `geofenceEnter`, `geofenceExit`, `deviceOverspeed`, `alarm`, `deviceOffline`. El reenvio apunta a `${BBS_API_URL}/api/v1/webhooks/traccar` con la cabecera `X-BBS-Webhook-Token`. Si la API corre en tu host, usa `BBS_API_URL=http://host.docker.internal:3000`. Hasta implementar el endpoint recibira 404.

Prueba manual del contrato:

```bash
curl -X POST http://localhost:3000/api/v1/webhooks/traccar \
  -H 'Content-Type: application/json' -H "X-BBS-Webhook-Token: $BBS_WEBHOOK_TOKEN" \
  -d '{"event":{"id":1,"type":"geofenceEnter","deviceId":17,"eventTime":"2026-10-06T14:12:07Z"}}'
```

## Validacion realizada

- `openapi.yaml` validado con `openapi-spec-validator` (OpenAPI 3.0.3), `operationId` unicos, enums identicos a los `CREATE TYPE` de la migracion 001.
- YAML del compose y de Grafana, JSON del dashboard y XML de Traccar parseados; `docker compose config` sin errores; scripts de `db-init` con `bash -n`.
- Scripts de `db-init` ejecutados en un PostgreSQL 16 real (migraciones + seeds + esquema `bi`); las 12 consultas del dashboard corren con el rol `bbs_readonly`, que no puede leer `public`.
- Los 11 diagramas Mermaid (documentos y `openapi.yaml`) pasan `mermaid.parse`.
- No verificado: arranque real de los contenedores (sin daemon Docker en el entorno), nombres exactos de claves de Traccar por version y renderizado en Grafana.
