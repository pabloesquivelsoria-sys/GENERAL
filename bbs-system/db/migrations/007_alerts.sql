-- 007: alertas y reglas de escalamiento
CREATE TABLE escalation_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       uuid REFERENCES sites(id) ON DELETE CASCADE,   -- NULL = regla global
  priority      priority_level NOT NULL,
  level         smallint NOT NULL CHECK (level BETWEEN 1 AND 3),
  days_overdue  int NOT NULL CHECK (days_overdue >= 0),         -- umbral de días vencidos
  notify_role   text NOT NULL,        -- 'owner_supervisor' | 'ehs_manager' | 'site_manager'
  channels      notification_channel[] NOT NULL DEFAULT ARRAY['in_app','websocket']::notification_channel[],
  is_active     boolean NOT NULL DEFAULT true,
  UNIQUE NULLS NOT DISTINCT (site_id, priority, level)
);

CREATE TABLE alerts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          alert_type NOT NULL,
  severity      severity_level NOT NULL DEFAULT 'medium',
  site_id       uuid REFERENCES sites(id) ON DELETE CASCADE,
  area_id       uuid REFERENCES areas(id) ON DELETE SET NULL,
  title         text NOT NULL,
  message       text,
  entity_type   text,                           -- observation | near_miss | capa
  entity_id     uuid,
  escalation_level smallint NOT NULL DEFAULT 0,
  status        alert_status NOT NULL DEFAULT 'open',
  dedupe_key    text,                           -- evita alertas duplicadas
  created_at    timestamptz NOT NULL DEFAULT now(),
  acknowledged_by uuid REFERENCES users(id),
  acknowledged_at timestamptz,
  resolved_at   timestamptz
);
CREATE UNIQUE INDEX uq_alert_dedupe ON alerts(dedupe_key) WHERE dedupe_key IS NOT NULL AND status <> 'resolved';
CREATE INDEX idx_alerts_status ON alerts(status, created_at DESC);
CREATE INDEX idx_alerts_entity ON alerts(entity_type, entity_id);

CREATE TABLE alert_recipients (
  alert_id   uuid NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel    notification_channel NOT NULL DEFAULT 'in_app',
  delivered_at timestamptz,
  read_at    timestamptz,
  PRIMARY KEY (alert_id, user_id, channel)
);
CREATE INDEX idx_alert_rcpt_user ON alert_recipients(user_id, read_at);
