# BBS (Behavior-Based Safety) - Arquitectura

Alcance: plataforma EHS para observaciones de comportamiento, near-miss, CAPA, alertas y KPIs, con tracking GPS opcional via Traccar.
Ciclo central: **Observacion -> Alerta -> CAPA -> Verificacion**.

## 1. Principios

1. **Offline-first en movil**: el observador registra en planta sin cobertura; sincroniza despues (cola local + `POST /observations/batch` idempotente).
2. **Un solo modelo de eventos**: toda fuente (movil, Traccar, importacion Excel) termina como una entidad de dominio + un evento interno en Redis (`bbs.events`).
3. **API primero**: `openapi.yaml` es el contrato; frontend, integraciones y BI lo consumen. El frontend genera su cliente tipado desde el.
4. **Integraciones desacopladas**: webhooks entrantes validados y encolados (BullMQ); notificaciones salientes por adaptadores (email/WhatsApp/Slack/webhook).
5. **BI sin tocar tablas operativas**: vistas `bi.*` de solo lectura sobre PostgreSQL con rol `bbs_readonly`.

## 2. Diagrama de componentes

```mermaid
flowchart LR
  subgraph Clients["Clientes"]
    PWA["PWA React movil\n(offline-first)"]
    WEB["Web React\n(supervisor / EHS)"]
  end

  subgraph Edge["Borde"]
    PROXY["Reverse proxy / TLS\n(Nginx o Traefik)"]
  end

  subgraph App["Backend NestJS"]
    API["API REST /api/v1"]
    WS["Gateway WebSocket\n(Socket.IO)"]
    subgraph Modules["Modulos"]
      AUTH[auth]
      OBS[observations]
      NM[near-misses]
      CAPA[capa]
      ALR[alerts]
      KPI[kpi]
      INT["integrations\n(traccar, imports, webhooks)"]
    end
    WORKER["Workers BullMQ\n(notificaciones, reglas,\nrecalculo KPI, imports)"]
  end

  subgraph Data["Datos"]
    PG[("PostgreSQL + PostGIS\nschema public / bi")]
    RD[("Redis\ncache, pub/sub, colas,\nGEO posiciones")]
    OBJ[("Object storage\nS3/MinIO - adjuntos")]
  end

  subgraph Ext["Herramientas externas"]
    TRC["Traccar\n(GPS tracking)"]
    IDP["IdP SSO\n(OIDC / SAML)"]
    SMTP["SMTP / SES"]
    WA["WhatsApp Cloud API"]
    SLK["Slack Webhook / App"]
    MB["Metabase"]
    GF["Grafana"]
  end

  PWA & WEB --> PROXY --> API
  PWA & WEB <-. "tiempo real" .-> WS
  API --> Modules
  WS --- RD
  Modules --> PG
  Modules --> RD
  Modules --> OBJ
  Modules -- encola --> RD
  RD -- consume --> WORKER
  WORKER --> PG
  WORKER --> SMTP & WA & SLK
  TRC -- "webhook eventos/posiciones" --> PROXY
  INT -- "REST (geocercas, devices)" --> TRC
  AUTH <--> IDP
  PG -- "vistas bi.* (solo lectura)" --> MB & GF
```

## 3. Componentes

| Componente | Tecnologia | Responsabilidad |
|---|---|---|
| Frontend movil | React + Vite + PWA (Workbox), Dexie (IndexedDB) | Captura rapida offline, cola de sync, fotos, GPS del dispositivo |
| Frontend web | React + TanStack Query + Router, MUI o shadcn/ui | CAPA board, near-miss, dashboards, administracion |
| API | NestJS (REST, OpenAPI via `@nestjs/swagger`), class-validator | Casos de uso, RBAC, validacion, idempotencia |
| WebSockets | `@nestjs/websockets` + Socket.IO + adapter Redis | Push de alertas, cambios de estado CAPA, contadores del dashboard |
| PostgreSQL | 16 + PostGIS | Fuente de verdad. Geometrias de geocercas/ubicaciones. Esquema `bi` para BI |
| Redis | 7 | Colas BullMQ, pub/sub, rate-limit, cache de KPIs, `GEOADD` de ultima posicion por dispositivo |
| Traccar | traccar/traccar | Ingesta GPS (200+ protocolos), geocercas, eventos; reenvia a BBS por webhook |
| Notificaciones | Adaptadores Nest (email, WhatsApp, Slack, webhook generico) | Envio con plantillas, reintentos, registro de entrega |
| BI | Metabase (negocio) y Grafana (operativo/mapas) | Lectura de vistas `bi.*` |
| Adjuntos | S3 compatible (MinIO en dev) | Fotos/evidencia con URL prefirmada |
| Observabilidad | OpenTelemetry, Prometheus, logs JSON | Trazas por `correlationId` |

## 4. Modulos backend y su contrato

| Modulo | Recursos OpenAPI | Eventos de dominio (Redis `bbs.events`) |
|---|---|---|
| auth | `/auth/*` | `user.logged_in` |
| observations | `/observations`, `/observations/batch`, `/catalog/*` | `observation.created`, `observation.at_risk_flagged` |
| near-misses | `/near-misses`, `/near-misses/map` | `nearmiss.reported`, `nearmiss.status_changed` |
| capa | `/capa`, `/capa/board`, `/capa/{id}/transitions`, `/capa/{id}/verification` | `capa.created`, `capa.status_changed`, `capa.overdue`, `capa.verified` |
| alerts | `/alerts`, `/alert-rules` | `alert.raised`, `alert.acknowledged` |
| kpi | `/kpis/*` | `kpi.snapshot_updated` |
| integrations | `/webhooks/*`, `/webhook-subscriptions`, `/imports/*`, `/geofences` | `integration.event_received` |

## 5. Flujos clave

### 5.1 Observacion -> Alerta -> CAPA -> Verificacion

```mermaid
sequenceDiagram
  autonumber
  actor O as Observador (PWA)
  participant API as API NestJS
  participant DB as PostgreSQL
  participant R as Redis/BullMQ
  participant W as Worker
  participant N as Email/WhatsApp/Slack
  participant WS as WebSocket
  actor S as Supervisor
  O->>API: POST /observations (o /batch al reconectar)
  API->>DB: INSERT observation (+ comportamientos)
  API->>R: publish observation.created
  R->>W: evaluar alert-rules
  W->>DB: INSERT alert (si regla cumple: at_risk, reincidencia, severidad)
  W->>N: notificar al responsable del area
  W->>WS: alert.raised
  WS-->>S: toast + contador
  S->>API: POST /capa (origin = observation/alert)
  S->>API: POST /capa/{id}/transitions {to: in_progress}
  Note over S,API: Responsable ejecuta accion
  S->>API: POST /capa/{id}/transitions {to: pending_verification}
  actor V as Verificador EHS
  V->>API: POST /capa/{id}/verification {effective:true|false}
  API->>DB: capa.status = closed | reopened
  API->>R: publish capa.verified
```

### 5.2 Traccar -> near-miss / alerta

```mermaid
sequenceDiagram
  autonumber
  participant D as Dispositivo GPS / app Traccar Client
  participant T as Traccar
  participant P as Proxy
  participant API as API /webhooks/traccar
  participant R as Redis
  participant W as Worker (reglas)
  participant DB as PostgreSQL
  D->>T: posicion (OsmAnd/proto nativo)
  T->>T: evalua geocercas / velocidad
  T->>P: POST event.forward.url (geofenceEnter, deviceOverspeed, alarm)
  P->>API: reenvia con header X-BBS-Webhook-Token
  API->>API: valida token, dedup por (deviceId,eventId)
  API->>R: encola traccar.event
  API-->>T: 202 Accepted
  R->>W: consume
  W->>DB: mapea device->activo/persona, aplica regla
  alt Regla = near-miss automatico
    W->>DB: INSERT near_miss (source=traccar, status=reported)
    W->>R: publish nearmiss.reported
  else Regla = alerta
    W->>DB: INSERT alert
  end
```

### 5.3 Sincronizacion offline

```mermaid
stateDiagram-v2
  [*] --> Borrador: usuario captura
  Borrador --> EnCola: guardar (IndexedDB, clientId UUID)
  EnCola --> Sincronizando: online + Background Sync
  Sincronizando --> Sincronizada: 201/200 (idempotente por clientId)
  Sincronizando --> EnCola: error red / 5xx (backoff)
  Sincronizando --> Rechazada: 422 validacion
  Rechazada --> Borrador: usuario corrige
  Sincronizada --> [*]
```

## 6. Decisiones de diseno

- **Idempotencia**: observaciones/near-misses aceptan `clientId` (UUIDv4 generado en el dispositivo); unico por tenant. Webhooks externos deduplican por clave natural (`traccar:{eventId}`).
- **Multi-sitio**: toda entidad lleva `siteId`; RBAC por rol (`observer`, `supervisor`, `ehs_manager`, `verifier`, `admin`) y alcance por sitio/area.
- **Tiempo real**: namespace `/realtime`, salas `site:{id}` y `user:{id}`. Eventos: `alert.raised`, `capa.status_changed`, `nearmiss.reported`, `kpi.updated`. Token JWT en handshake.
- **Geodatos**: PostGIS `geography(Point,4326)` para ubicaciones, `geography(Polygon)` para geocercas; la fuente de las geocercas es BBS y se sincroniza a Traccar (o viceversa, configurable) via `/geofences`.
- **Privacidad**: el tracking de personas requiere base legal/consentimiento; por defecto Traccar solo rastrea **vehiculos y equipos**; los tags de personas son opt-in. Retencion de posiciones 30-90 dias.
- **Seguridad**: JWT corto (15 min) + refresh rotatorio, SSO OIDC, HMAC/token en webhooks, rate-limit en Redis, adjuntos con URL prefirmada y antivirus opcional.
- **Escalado**: API stateless; WS con adapter Redis; workers escalan por cola.
- **BI**: Metabase para autoservicio de gerencia; Grafana para mapa de calor y series casi en tiempo real. Ambos con rol `bbs_readonly` sobre esquema `bi`.

## 7. Entornos

| Entorno | Notas |
|---|---|
| dev/integracion | `integration/docker-compose.yml` (Traccar, Metabase, Grafana, Mailhog, Postgres, Redis) |
| prod | Contenedores orquestados (K8s/ECS), Postgres gestionado, Redis gestionado, S3, TLS, secretos en vault |

## 8. Documentos relacionados

- `UX.md`: flujos y wireframes, estructura React.
- `INTEGRACIONES.md`: conexion y payloads de cada herramienta.
- `openapi.yaml`: contrato de la API.
- `integration/`: entorno de referencia.
