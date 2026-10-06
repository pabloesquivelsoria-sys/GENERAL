-- 004: observaciones BBS
CREATE TABLE observations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        text NOT NULL UNIQUE DEFAULT ('OBS-' || to_char(now(),'YYYY') || '-' || lpad(nextval('obs_seq')::text, 6, '0')),
  site_id          uuid NOT NULL REFERENCES sites(id),
  area_id          uuid REFERENCES areas(id),
  location_detail  text,
  checklist_id     uuid REFERENCES checklists(id),
  observer_id      uuid NOT NULL REFERENCES users(id),
  -- observado: opcional; si is_anonymous_observed, no se guarda identidad
  observed_user_id uuid REFERENCES users(id),
  observed_name    text,
  observed_company text,                       -- contratista
  is_anonymous_observed boolean NOT NULL DEFAULT true,
  observed_at      timestamptz NOT NULL DEFAULT now(),
  shift            text,
  task_observed    text,
  duration_minutes int CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  people_observed  int NOT NULL DEFAULT 1 CHECK (people_observed >= 1),
  status           observation_status NOT NULL DEFAULT 'submitted',
  positive_feedback_given boolean NOT NULL DEFAULT false,
  coaching_notes   text,
  immediate_action text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT is_anonymous_observed OR (observed_user_id IS NULL AND observed_name IS NULL))
);
CREATE INDEX idx_obs_site_date ON observations(site_id, observed_at DESC);
CREATE INDEX idx_obs_area_date ON observations(area_id, observed_at DESC);
CREATE INDEX idx_obs_observer ON observations(observer_id);
CREATE INDEX idx_obs_observed ON observations(observed_user_id) WHERE observed_user_id IS NOT NULL;

-- detalle: un registro por comportamiento evaluado
CREATE TABLE observation_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id uuid NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
  behavior_id    uuid NOT NULL REFERENCES behaviors(id),
  result         behavior_result NOT NULL,
  severity       severity_level,               -- relevante cuando result = at_risk
  comment        text,
  corrected_on_spot boolean NOT NULL DEFAULT false,
  UNIQUE (observation_id, behavior_id),
  CHECK (result = 'at_risk' OR severity IS NULL)
);
CREATE INDEX idx_obsitem_behavior ON observation_items(behavior_id, result);
CREATE INDEX idx_obsitem_obs ON observation_items(observation_id);

CREATE TABLE observation_item_factors (
  observation_item_id uuid NOT NULL REFERENCES observation_items(id) ON DELETE CASCADE,
  factor_id           smallint NOT NULL REFERENCES causal_factors(id),
  notes               text,
  PRIMARY KEY (observation_item_id, factor_id)
);

CREATE TABLE attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  text NOT NULL CHECK (entity_type IN ('observation','near_miss','capa','capa_verification')),
  entity_id    uuid NOT NULL,
  file_name    text NOT NULL,
  mime_type    text,
  size_bytes   bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  storage_url  text NOT NULL,
  uploaded_by  uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_attach_entity ON attachments(entity_type, entity_id);

CREATE TRIGGER trg_obs_upd BEFORE UPDATE ON observations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
