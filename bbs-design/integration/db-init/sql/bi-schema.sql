-- Esquema bi: vistas de solo lectura para Grafana/Metabase (rol bbs_readonly).
-- Se ejecuta como superusuario sobre la base 'bbs' (ver 03-apply-bi.sh) despues de las migraciones.
-- Nombres alineados con INTEGRACIONES.md sec. 6; columnas con nombres del esquema SQL (snake_case).
-- Las vistas NO exponen datos personales: observador/observado/reportante se publican como alias o se omiten.

CREATE SCHEMA IF NOT EXISTS bi AUTHORIZATION bbs;
SET ROLE bbs;

CREATE OR REPLACE VIEW bi.v_observations AS
SELECT o.id, o.reference, o.observed_at, o.status::text AS status,
       s.code AS site_code, s.name AS site_name, a.code AS area_code, a.name AS area_name,
       o.shift, o.people_observed, o.positive_feedback_given,
       o.observer_id,   -- id opaco para conteos de participacion; sin nombre
       count(i.id) FILTER (WHERE i.result = 'safe')    AS safe_count,
       count(i.id) FILTER (WHERE i.result = 'at_risk') AS at_risk_count,
       round(100.0 * count(i.id) FILTER (WHERE i.result = 'safe')
             / NULLIF(count(i.id) FILTER (WHERE i.result <> 'not_applicable'), 0), 2) AS safe_rate_pct
FROM observations o
JOIN sites s ON s.id = o.site_id
LEFT JOIN areas a ON a.id = o.area_id
LEFT JOIN observation_items i ON i.observation_id = o.id
WHERE o.status <> 'draft'
GROUP BY o.id, s.code, s.name, a.code, a.name;

CREATE OR REPLACE VIEW bi.v_observation_behaviors AS
SELECT i.id, o.id AS observation_id, o.observed_at, s.code AS site_code, a.name AS area_name,
       c.name AS category, b.code AS behavior_code, b.name AS behavior,
       i.result::text AS result, i.severity::text AS severity, i.corrected_on_spot
FROM observation_items i
JOIN observations o ON o.id = i.observation_id AND o.status <> 'draft'
JOIN sites s ON s.id = o.site_id
LEFT JOIN areas a ON a.id = o.area_id
JOIN behaviors b ON b.id = i.behavior_id
JOIN behavior_categories c ON c.id = b.category_id;

CREATE OR REPLACE VIEW bi.v_near_misses AS
SELECT n.id, n.reference, n.occurred_at, n.status::text AS status, n.potential_severity::text AS potential_severity,
       n.likelihood, n.risk_score, s.code AS site_code, a.name AS area_name,
       n.is_anonymous, n.closed_at,
       EXISTS (SELECT 1 FROM capas c WHERE c.source_near_miss_id = n.id) AS has_capa
FROM near_misses n
JOIN sites s ON s.id = n.site_id
LEFT JOIN areas a ON a.id = n.area_id;

CREATE OR REPLACE VIEW bi.v_capa AS
SELECT c.id, c.reference, c.created_at, c.type::text AS type, c.source::text AS source, c.priority::text AS priority,
       c.status::text AS status, c.control_level::text AS control_level,
       s.code AS site_code, a.name AS area_name, ow.full_name AS owner_name,
       c.due_date, c.original_due_date, c.extension_count, c.escalation_level, c.closed_at,
       (c.status IN ('open','in_progress','verification') AND c.due_date < current_date) AS is_overdue,
       CASE WHEN c.status IN ('open','in_progress','verification') THEN GREATEST(current_date - c.due_date, 0) END AS days_overdue,
       CASE WHEN c.status = 'closed' THEN round(EXTRACT(EPOCH FROM (c.closed_at - c.created_at)) / 86400.0, 2) END AS days_to_close,
       (SELECT v.is_effective FROM capa_verifications v WHERE v.capa_id = c.id ORDER BY v.verified_at DESC LIMIT 1) AS last_verification_effective
FROM capas c
JOIN sites s ON s.id = c.site_id
LEFT JOIN areas a ON a.id = c.area_id
JOIN users ow ON ow.id = c.owner_id;

CREATE OR REPLACE VIEW bi.v_alerts AS
SELECT al.id, al.created_at, al.type::text AS type, al.severity::text AS severity, al.status::text AS status,
       s.code AS site_code, al.entity_type, al.escalation_level,
       al.acknowledged_at, al.resolved_at,
       round(EXTRACT(EPOCH FROM (al.acknowledged_at - al.created_at)) / 3600.0, 2) AS hours_to_ack,
       round(EXTRACT(EPOCH FROM (al.resolved_at - al.created_at)) / 3600.0, 2)     AS hours_to_resolve
FROM alerts al LEFT JOIN sites s ON s.id = al.site_id;

CREATE OR REPLACE VIEW bi.v_safe_behavior_daily AS
SELECT d.day, s.code AS site_code, a.name AS area_name, c.name AS category,
       d.safe_count, d.at_risk_count, d.evaluated_count, d.safe_rate_pct
FROM public.v_safe_behavior_daily d
JOIN sites s ON s.id = d.site_id
LEFT JOIN areas a ON a.id = d.area_id
JOIN behavior_categories c ON c.id = d.category_id;

CREATE OR REPLACE VIEW bi.v_capa_summary AS
SELECT s.code AS site_code, v.* FROM public.v_capa_summary v JOIN sites s ON s.id = v.site_id;

CREATE OR REPLACE VIEW bi.v_kpi_snapshots AS
SELECT k.snapshot_date, s.code AS site_code, k.metric, k.value
FROM kpi_snapshots k LEFT JOIN sites s ON s.id = k.site_id;

RESET ROLE;

-- permisos: bbs_readonly solo ve el esquema bi (las vistas corren con los privilegios de su dueno 'bbs')
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM bbs_readonly;
GRANT USAGE ON SCHEMA bi TO bbs_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA bi TO bbs_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE bbs IN SCHEMA bi GRANT SELECT ON TABLES TO bbs_readonly;
ALTER ROLE bbs_readonly SET search_path = bi;
