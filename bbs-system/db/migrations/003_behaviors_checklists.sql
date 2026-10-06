-- 003: categorías de comportamiento, comportamientos, checklists
CREATE TABLE behavior_categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,
  name         text NOT NULL,
  description  text,
  sort_order   int NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE behaviors (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id       uuid NOT NULL REFERENCES behavior_categories(id) ON DELETE RESTRICT,
  code              text NOT NULL UNIQUE,
  name              text NOT NULL,
  safe_description  text,      -- cómo se ve el comportamiento seguro
  at_risk_description text,    -- cómo se ve el comportamiento inseguro
  default_severity  severity_level NOT NULL DEFAULT 'medium',
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_behaviors_category ON behaviors(category_id);

CREATE TABLE checklists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text,
  site_id     uuid REFERENCES sites(id) ON DELETE CASCADE,  -- NULL = global
  area_id     uuid REFERENCES areas(id) ON DELETE SET NULL,
  version     int NOT NULL DEFAULT 1,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE checklist_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  behavior_id  uuid NOT NULL REFERENCES behaviors(id) ON DELETE RESTRICT,
  sort_order   int NOT NULL DEFAULT 0,
  is_critical  boolean NOT NULL DEFAULT false,  -- un 'at_risk' aquí dispara alerta inmediata
  UNIQUE (checklist_id, behavior_id)
);

-- factores causales (ABC / human factors) para análisis de por qué ocurre el comportamiento
CREATE TABLE causal_factors (
  id          smallserial PRIMARY KEY,
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  group_name  text NOT NULL   -- p.ej. 'Entorno', 'Organización', 'Persona', 'Equipo'
);

CREATE TRIGGER trg_bcat_upd BEFORE UPDATE ON behavior_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_beh_upd BEFORE UPDATE ON behaviors FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_chk_upd BEFORE UPDATE ON checklists FOR EACH ROW EXECUTE FUNCTION set_updated_at();
