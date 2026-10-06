-- 008: historial de auditoría (append-only) + triggers
CREATE TABLE audit_log (
  id          bigserial PRIMARY KEY,
  table_name  text NOT NULL,
  record_id   text NOT NULL,
  action      audit_action NOT NULL,
  actor_id    uuid,                         -- app.current_user_id (SET LOCAL desde la API)
  old_data    jsonb,
  new_data    jsonb,
  changed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_record ON audit_log(table_name, record_id, changed_at);
CREATE INDEX idx_audit_actor ON audit_log(actor_id, changed_at);

CREATE OR REPLACE FUNCTION audit_row_change() RETURNS trigger AS $$
DECLARE
  actor uuid := NULLIF(current_setting('app.current_user_id', true), '')::uuid;
  rec   jsonb;
BEGIN
  rec := to_jsonb(CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END);
  INSERT INTO audit_log(table_name, record_id, action, actor_id, old_data, new_data)
  VALUES (TG_TABLE_NAME, rec->>'id', TG_OP::audit_action, actor,
          CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
          CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END);
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

-- inmutabilidad
CREATE OR REPLACE FUNCTION audit_block_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'audit_log es append-only'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_audit_immutable BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_block_mutation();

CREATE TRIGGER aud_observations AFTER INSERT OR UPDATE OR DELETE ON observations FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER aud_observation_items AFTER INSERT OR UPDATE OR DELETE ON observation_items FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER aud_near_misses AFTER INSERT OR UPDATE OR DELETE ON near_misses FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER aud_capas AFTER INSERT OR UPDATE OR DELETE ON capas FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER aud_capa_verifications AFTER INSERT OR UPDATE OR DELETE ON capa_verifications FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER aud_alerts AFTER INSERT OR UPDATE OR DELETE ON alerts FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER aud_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_row_change();
CREATE TRIGGER aud_user_roles AFTER INSERT OR UPDATE OR DELETE ON user_roles FOR EACH ROW EXECUTE FUNCTION audit_row_change();
