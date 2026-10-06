-- 002: sitios, áreas, usuarios y roles
CREATE TABLE sites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  country     text,
  timezone    text NOT NULL DEFAULT 'UTC',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE areas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES areas(id) ON DELETE SET NULL,
  code        text NOT NULL,
  name        text NOT NULL,
  risk_level  severity_level NOT NULL DEFAULT 'medium',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, code)
);
CREATE INDEX idx_areas_site ON areas(site_id);

CREATE TABLE roles (
  id          smallserial PRIMARY KEY,
  code        text NOT NULL UNIQUE,   -- admin, ehs_manager, supervisor, observer, capa_owner, viewer
  name        text NOT NULL,
  description text
);

CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          citext NOT NULL UNIQUE,
  full_name      text NOT NULL,
  password_hash  text NOT NULL,
  employee_code  text UNIQUE,
  job_title      text,
  supervisor_id  uuid REFERENCES users(id) ON DELETE SET NULL,  -- cadena de escalamiento
  home_site_id   uuid REFERENCES sites(id) ON DELETE SET NULL,
  home_area_id   uuid REFERENCES areas(id) ON DELETE SET NULL,
  is_active      boolean NOT NULL DEFAULT true,
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_supervisor ON users(supervisor_id);

-- rol por usuario, opcionalmente acotado a un sitio (NULL = global)
CREATE TABLE user_roles (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id   smallint NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  site_id   uuid REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE NULLS NOT DISTINCT (user_id, role_id, site_id)
);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

CREATE TRIGGER trg_sites_upd BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_areas_upd BEFORE UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_upd BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
