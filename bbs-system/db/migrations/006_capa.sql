-- 006: CAPA (acciones correctivas y preventivas)
CREATE TABLE capas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference      text NOT NULL UNIQUE DEFAULT ('CAPA-' || to_char(now(),'YYYY') || '-' || lpad(nextval('capa_seq')::text, 6, '0')),
  site_id        uuid NOT NULL REFERENCES sites(id),
  area_id        uuid REFERENCES areas(id),
  title          text NOT NULL,
  description    text NOT NULL,
  type           capa_type NOT NULL DEFAULT 'corrective',
  control_level  hierarchy_control,            -- jerarquía de controles
  source         capa_source NOT NULL DEFAULT 'other',
  source_observation_id uuid REFERENCES observations(id) ON DELETE SET NULL,
  source_observation_item_id uuid REFERENCES observation_items(id) ON DELETE SET NULL,
  source_near_miss_id   uuid REFERENCES near_misses(id) ON DELETE SET NULL,
  root_cause     text,
  priority       priority_level NOT NULL DEFAULT 'medium',
  status         capa_status NOT NULL DEFAULT 'open',
  owner_id       uuid NOT NULL REFERENCES users(id),     -- responsable
  verifier_id    uuid REFERENCES users(id),              -- debe ser distinto del owner
  created_by     uuid NOT NULL REFERENCES users(id),
  due_date       date NOT NULL,
  original_due_date date NOT NULL,
  extension_count int NOT NULL DEFAULT 0,
  escalation_level smallint NOT NULL DEFAULT 0 CHECK (escalation_level BETWEEN 0 AND 3),
  last_escalated_at timestamptz,
  started_at     timestamptz,
  submitted_for_verification_at timestamptz,
  closed_at      timestamptz,
  cancelled_reason text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CHECK (verifier_id IS NULL OR verifier_id <> owner_id),
  CHECK (status <> 'closed' OR closed_at IS NOT NULL),
  CHECK (source <> 'observation' OR source_observation_id IS NOT NULL OR source_observation_item_id IS NOT NULL),
  CHECK (source <> 'near_miss' OR source_near_miss_id IS NOT NULL)
);
CREATE INDEX idx_capa_status_due ON capas(status, due_date);
CREATE INDEX idx_capa_owner ON capas(owner_id, status);
CREATE INDEX idx_capa_site ON capas(site_id, created_at DESC);
CREATE INDEX idx_capa_open_overdue ON capas(due_date) WHERE status IN ('open','in_progress','verification');

-- comentarios / bitácora de avance
CREATE TABLE capa_updates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capa_id    uuid NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
  author_id  uuid REFERENCES users(id),
  from_status capa_status,
  to_status   capa_status,
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_capa_updates_capa ON capa_updates(capa_id, created_at);

-- solicitudes de extensión de plazo (requieren aprobación)
CREATE TABLE capa_extensions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capa_id       uuid NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
  requested_by  uuid NOT NULL REFERENCES users(id),
  approved_by   uuid REFERENCES users(id),
  old_due_date  date NOT NULL,
  new_due_date  date NOT NULL,
  reason        text NOT NULL,
  approved      boolean,
  created_at    timestamptz NOT NULL DEFAULT now(),
  decided_at    timestamptz,
  CHECK (new_due_date > old_due_date)
);

-- verificación de eficacia (puede haber varios intentos)
CREATE TABLE capa_verifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capa_id       uuid NOT NULL REFERENCES capas(id) ON DELETE CASCADE,
  verifier_id   uuid NOT NULL REFERENCES users(id),
  is_effective  boolean NOT NULL,
  method        text,                   -- observación de seguimiento, inspección, revisión documental
  findings      text,
  follow_up_observation_id uuid REFERENCES observations(id) ON DELETE SET NULL,
  verified_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_capa_verif_capa ON capa_verifications(capa_id, verified_at);

CREATE TRIGGER trg_capa_upd BEFORE UPDATE ON capas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
