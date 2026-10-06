# BBS - Seguimiento de Behavior-Based Safety (EHS)

API NestJS (TypeScript) + PostgreSQL + Redis para registrar observaciones de comportamiento, generar alertas, gestionar acciones correctivas y preventivas (CAPA) con verificación de eficacia y escalar por vencimiento.

## Flujo de seguimiento

```
Observación ──(at_risk)──> Alerta ──> CAPA ──> Verificación ──> Cierre
Near-miss  ──────────────> Alerta ──> CAPA ──┘
                                CAPA vencida ──> Escalamiento (niveles 1-3)
```

1. **Observación** (`POST /observations`): el observador evalúa comportamientos de un checklist (`safe` / `at_risk` / `not_applicable`), con severidad, factores causales y acción inmediata. Por defecto el observado es anónimo. Estados: `draft -> submitted -> reviewed -> archived`.
2. **Alerta**: al enviar una observación, cada `at_risk` crea una alerta `unsafe_behavior` (crítica si el ítem es crítico en el checklist) para supervisores/EHS del sitio. Si el mismo comportamiento se repite en la misma área (umbral `REPEAT_UNSAFE_THRESHOLD` en `REPEAT_UNSAFE_WINDOW_DAYS`) se genera `repeat_unsafe_behavior`. Un near-miss genera `near_miss_reported`. Las alertas son idempotentes (`dedupe_key`).
3. **Near-miss** (`POST /near-misses`, anónimo opcional): `reported -> under_investigation -> capa_assigned -> closed`. No se cierra sin causa raíz ni con CAPA abiertas.
4. **CAPA** (`POST /capa`, origen observación/near-miss/otro, jerarquía de controles, responsable, verificador distinto del responsable, fecha límite). Máquina de estados:

   ```
   open ──> in_progress ──> verification ──> closed
                 ^_______________|   (verificación no eficaz / devolución)
   open | in_progress | verification ──> cancelled   (solo gerentes, con motivo)
   ```
   - `open -> in_progress`: responsable, creador o gerente.
   - `in_progress -> verification`: responsable/gerente; exige verificador asignado y `comment` con la evidencia.
   - `closed` **solo** por `POST /capa/:id/verifications` con `is_effective=true` (el responsable no puede verificar su propia CAPA). Si `is_effective=false` vuelve a `in_progress`.
   - Cada transición queda en `capa_updates` (bitácora) y en `audit_log` (acción `TRANSITION`, además de los triggers INSERT/UPDATE con el actor real vía `app.current_user_id`). Consulta `GET /capa/:id/history`.
   - Extensiones de plazo: solicitud (`POST /capa/:id/extensions`) y decisión de un gerente distinto al solicitante; máximo `CAPA_MAX_EXTENSIONS`.
5. **Escalamiento por vencimiento**: un scheduler (cada 10 min, con lock en Redis para varias réplicas) evalúa `escalation_rules` (por prioridad; override por sitio sobre la regla global). Una CAPA vencida sube a nivel 1/2/3 según los días vencidos y notifica al responsable + supervisor del responsable / gerente EHS / gerente de sitio. También avisa de CAPA por vencer y de verificaciones estancadas. Se puede disparar manualmente: `POST /alerts/escalation/run`.
6. **KPIs**: tasa de comportamiento seguro, top comportamientos de riesgo, CAPA vencidas / tiempo de cierre / cierre a tiempo, near-miss con CAPA. Cálculo en SQL (migración 009), caché de 60 s en Redis y snapshots nocturnos.

## Levantar

```bash
cp .env.example .env        # define POSTGRES_PASSWORD y JWT_SECRET
docker compose up --build
curl localhost:3000/api/v1/health
```

Servicios: `postgres` (16), `migrate` (job que aplica `db/migrations` y, con `SEED=true`, `db/seeds` de forma idempotente y termina), `redis` (7) y `api` (puerto `API_PORT`, 3000 por defecto). La API arranca solo cuando las migraciones terminaron.

Sin Docker: `DATABASE_URL=postgres://... ./db/migrate.sh --seed`, luego en `api/`: `npm install && npm run start:dev` (requiere `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`).

### Primer uso

El **primer usuario** registrado recibe el rol `admin`; los siguientes entran como `observer`. Pon `ALLOW_SELF_REGISTER=false` para cerrar el registro y que el admin asigne roles.

```bash
curl -X POST localhost:3000/api/v1/auth/register -H 'content-type: application/json' \
  -d '{"email":"admin@empresa.com","password":"una-clave-larga-123","full_name":"Admin"}'
# => { user, access_token, roles }     Usa: Authorization: Bearer <access_token>
```

El seed `002_demo_site.sql` crea un sitio demo (`PLANTA-01`) con cuatro áreas; no lo uses en producción. `GET /observations/catalog` devuelve sitios/áreas, comportamientos, checklists y factores causales para los formularios.

## Endpoints (prefijo `/api/v1`)

Todos requieren JWT salvo `health`, `auth/register` y `auth/login`. Admin siempre pasa el chequeo de rol. Los listados aceptan `page` y `limit` (máx. 100) y devuelven `{ data, meta }`.

| Módulo | Método y ruta | Roles | Descripción |
|---|---|---|---|
| Sistema | `GET /health` | público | Estado de PostgreSQL y Redis (503 si la BD cae) |
| Auth | `POST /auth/register`, `POST /auth/login` | público | Alta y login (JWT) |
| | `GET /auth/me` | autenticado | Perfil y roles |
| | `GET /auth/users?q=` | supervisor+ | Buscar usuarios |
| | `POST /auth/users/:id/roles`, `DELETE /auth/users/:id/roles/:role` | admin | Asignar / revocar rol (opcional `site_id`) |
| Observaciones | `POST /observations` | observer, supervisor, EHS, site_manager | Crear (`save_as_draft` opcional) |
| | `GET /observations`, `GET /observations/:id`, `GET /observations/catalog` | autenticado | Filtros: sitio, área, observador, estado, fechas, `has_at_risk` |
| | `PATCH /observations/:id/status` | observer/supervisor+ | draft->submitted->reviewed->archived |
| Near-miss | `POST /near-misses` | observer, supervisor, EHS, site_manager, capa_owner | Reportar (`is_anonymous`) |
| | `GET /near-misses`, `GET /near-misses/:id` | autenticado | |
| | `PATCH /near-misses/:id`, `POST /near-misses/:id/status` | supervisor, EHS, site_manager | Causa raíz, factores; cambio de estado |
| CAPA | `POST /capa` | supervisor, EHS, site_manager | Crear |
| | `GET /capa`, `GET /capa/:id`, `GET /capa/:id/history` | autenticado | Filtros: `status`, `priority`, `source`, `overdue`, `mine`, sitio, área, responsable |
| | `PATCH /capa/:id` | supervisor+ | Editar mientras esté activa |
| | `POST /capa/:id/transition` | owner/supervisor+ | `{to, comment}` (no permite `closed`) |
| | `POST /capa/:id/verifications` | verificador asignado o gerente | `{is_effective, findings, method?, follow_up_observation_id?}`; eficaz cierra |
| | `POST /capa/:id/comments` | participantes | Bitácora |
| | `POST /capa/:id/extensions`, `POST /capa/extensions/:extId/decision` | owner / EHS, site_manager | Extensión de plazo |
| Alertas | `GET /alerts` (`mine`, `unread`, `status`, `type`) | autenticado | `mine=false` solo supervisor+ |
| | `GET /alerts/unread-count`, `POST /alerts/:id/read`, `POST /alerts/:id/acknowledge` | destinatario | |
| | `POST /alerts/:id/resolve` | supervisor+ | |
| | `POST /alerts/escalation/run` | EHS | Ejecuta el barrido de escalamiento |
| KPI | `GET /kpi/summary`, `/kpi/top-at-risk-behaviors`, `/kpi/safe-rate-trend`, `/kpi/capa-summary`, `/kpi/snapshots` | autenticado | Parámetros `site_id`, `from`, `to` (por defecto 30 días) |
| | `POST /kpi/snapshots/run` | EHS | Fuerza el snapshot |

"supervisor+" = supervisor, ehs_manager, site_manager (y admin). Roles: `admin, ehs_manager, site_manager, supervisor, observer, capa_owner, viewer`. El rol `viewer` es solo lectura.

## Estructura

```
db/migrations/   esquema (enums, sitios/usuarios, observaciones, near-miss, CAPA, alertas, auditoría, KPIs)
db/seeds/        roles, factores causales, comportamientos, checklist base, reglas de escalamiento, sitio demo
db/migrate.sh    aplicador idempotente (schema_migrations)
api/src/         common (guards, decorators, enums, withActor), auth, observations, near-misses, capa,
                 alerts (+scheduler), kpi, database (TypeORM DataSource + Redis)
```

La API usa SQL parametrizado sobre el `DataSource` de TypeORM (sin entidades); toda escritura corre en una transacción que fija `app.current_user_id` (`withActor`) para que el `audit_log` registre al actor real. Los near-miss anónimos se escriben con actor nulo.

## Desarrollo

```bash
cd api && npm install
npm run typecheck     # tsc --noEmit
npm run build         # nest build
npm test              # pruebas de la máquina de estados (node:test)
```

## Pendiente / límites conocidos

- Canales `websocket` y `email` de `notification_channel` están en el esquema, pero hoy solo se entregan alertas `in_app` (consulta por API).
- No hay subida de archivos: la tabla `attachments` existe sin endpoints.
- Alcance por sitio: los roles pueden acotarse a un sitio (`user_roles.site_id`) para destinatarios de alertas, pero los endpoints de lectura no filtran por sitio del usuario.
