-- 005: registro de casi-accidentes (near miss)
CREATE TABLE near_misses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference        text NOT NULL UNIQUE DEFAULT ('NM-' || to_char(now(),'YYYY') || '-' || lpad(nextval('nm_seq')::text, 6, '0')),
  site_id          uuid NOT NULL REFERENCES sites(id),
  area_id          uuid REFERENCES areas(id),
  location_detail  text,
  reported_by      uuid REFERENCES users(id),      -- NULL permitido si reporte anónimo
  is_anonymous     boolean NOT NULL DEFAULT false,
  occurred_at      timestamptz NOT NULL DEFAULT now(),
  title            text NOT NULL,
  description      text NOT NULL,
  potential_severity severity_level NOT NULL DEFAULT 'medium',
  likelihood       smallint CHECK (likelihood BETWEEN 1 AND 5),
  risk_score       smallint GENERATED ALWAYS AS (
                     CASE potential_severity WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 ELSE 4 END
                     * COALESCE(likelihood, 1)) STORED,
  related_observation_id uuid REFERENCES observations(id) ON DELETE SET NULL,
  related_behavior_id    uuid REFERENCES behaviors(id) ON DELETE SET NULL,
  immediate_action text,
  root_cause       text,
  status           near_miss_status NOT NULL DEFAULT 'reported',
  closed_at        timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (is_anonymous = false OR reported_by IS NULL)
);
CREATE INDEX idx_nm_site_date ON near_misses(site_id, occurred_at DESC);
CREATE INDEX idx_nm_status ON near_misses(status);

CREATE TABLE near_miss_factors (
  near_miss_id uuid NOT NULL REFERENCES near_misses(id) ON DELETE CASCADE,
  factor_id    smallint NOT NULL REFERENCES causal_factors(id),
  PRIMARY KEY (near_miss_id, factor_id)
);

CREATE TRIGGER trg_nm_upd BEFORE UPDATE ON near_misses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
