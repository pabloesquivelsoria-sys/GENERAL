-- 009: KPIs (vistas y funciones) y snapshots

-- Tasa de comportamiento seguro por día/sitio/área/categoría
CREATE OR REPLACE VIEW v_safe_behavior_daily AS
SELECT o.site_id, o.area_id, b.category_id,
       date_trunc('day', o.observed_at)::date AS day,
       count(*) FILTER (WHERE i.result = 'safe')    AS safe_count,
       count(*) FILTER (WHERE i.result = 'at_risk') AS at_risk_count,
       count(*) FILTER (WHERE i.result <> 'not_applicable') AS evaluated_count,
       round(100.0 * count(*) FILTER (WHERE i.result = 'safe')
             / NULLIF(count(*) FILTER (WHERE i.result <> 'not_applicable'), 0), 2) AS safe_rate_pct
FROM observations o
JOIN observation_items i ON i.observation_id = o.id
JOIN behaviors b ON b.id = i.behavior_id
WHERE o.status <> 'draft'
GROUP BY o.site_id, o.area_id, b.category_id, date_trunc('day', o.observed_at);

-- Resumen de CAPA: abiertas, vencidas, tiempo medio de cierre, % cierre a tiempo
CREATE OR REPLACE VIEW v_capa_summary AS
SELECT site_id,
       count(*) FILTER (WHERE status IN ('open','in_progress','verification')) AS open_count,
       count(*) FILTER (WHERE status IN ('open','in_progress','verification') AND due_date < current_date) AS overdue_count,
       count(*) FILTER (WHERE status = 'closed') AS closed_count,
       round(avg(EXTRACT(EPOCH FROM (closed_at - created_at)) / 86400.0)
             FILTER (WHERE status = 'closed')::numeric, 2) AS avg_days_to_close,
       round(100.0 * count(*) FILTER (WHERE status = 'closed' AND closed_at::date <= due_date)
             / NULLIF(count(*) FILTER (WHERE status = 'closed'), 0), 2) AS on_time_close_pct
FROM capas GROUP BY site_id;

-- Funciones parametrizables por rango de fechas
CREATE OR REPLACE FUNCTION fn_kpi_summary(p_site uuid, p_from timestamptz, p_to timestamptz)
RETURNS TABLE (
  observations_count bigint,
  behaviors_evaluated bigint,
  safe_behavior_rate_pct numeric,
  at_risk_count bigint,
  near_miss_count bigint,
  observations_per_observer numeric,
  capa_opened bigint,
  capa_closed bigint,
  capa_overdue_now bigint,
  avg_capa_close_days numeric,
  capa_on_time_close_pct numeric,
  near_miss_to_capa_pct numeric
) LANGUAGE sql STABLE AS $$
  WITH obs AS (
    SELECT o.id, o.observer_id FROM observations o
    WHERE o.status <> 'draft' AND o.observed_at >= p_from AND o.observed_at < p_to
      AND (p_site IS NULL OR o.site_id = p_site)
  ), items AS (
    SELECT i.result FROM observation_items i JOIN obs ON obs.id = i.observation_id
  ), nm AS (
    SELECT n.id, n.status FROM near_misses n
    WHERE n.occurred_at >= p_from AND n.occurred_at < p_to AND (p_site IS NULL OR n.site_id = p_site)
  ), c AS (
    SELECT * FROM capas WHERE (p_site IS NULL OR site_id = p_site)
  )
  SELECT
    (SELECT count(*) FROM obs),
    (SELECT count(*) FROM items WHERE result <> 'not_applicable'),
    (SELECT round(100.0 * count(*) FILTER (WHERE result='safe') / NULLIF(count(*) FILTER (WHERE result<>'not_applicable'),0), 2) FROM items),
    (SELECT count(*) FROM items WHERE result = 'at_risk'),
    (SELECT count(*) FROM nm),
    (SELECT round(count(*)::numeric / NULLIF(count(DISTINCT observer_id),0), 2) FROM obs),
    (SELECT count(*) FROM c WHERE created_at >= p_from AND created_at < p_to),
    (SELECT count(*) FROM c WHERE status='closed' AND closed_at >= p_from AND closed_at < p_to),
    (SELECT count(*) FROM c WHERE status IN ('open','in_progress','verification') AND due_date < current_date),
    (SELECT round(avg(EXTRACT(EPOCH FROM (closed_at - created_at))/86400.0)::numeric, 2) FROM c
       WHERE status='closed' AND closed_at >= p_from AND closed_at < p_to),
    (SELECT round(100.0 * count(*) FILTER (WHERE closed_at::date <= due_date) / NULLIF(count(*),0), 2) FROM c
       WHERE status='closed' AND closed_at >= p_from AND closed_at < p_to),
    (SELECT round(100.0 * count(*) FILTER (WHERE status IN ('capa_assigned','closed')) / NULLIF(count(*),0), 2) FROM nm);
$$;

-- Top comportamientos inseguros
CREATE OR REPLACE FUNCTION fn_top_at_risk_behaviors(p_site uuid, p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 10)
RETURNS TABLE (behavior_id uuid, behavior_code text, behavior_name text, category_name text, at_risk_count bigint, total_count bigint, at_risk_pct numeric)
LANGUAGE sql STABLE AS $$
  SELECT b.id, b.code, b.name, c.name,
         count(*) FILTER (WHERE i.result='at_risk'),
         count(*) FILTER (WHERE i.result<>'not_applicable'),
         round(100.0 * count(*) FILTER (WHERE i.result='at_risk') / NULLIF(count(*) FILTER (WHERE i.result<>'not_applicable'),0), 2)
  FROM observation_items i
  JOIN observations o ON o.id = i.observation_id AND o.status <> 'draft'
  JOIN behaviors b ON b.id = i.behavior_id
  JOIN behavior_categories c ON c.id = b.category_id
  WHERE o.observed_at >= p_from AND o.observed_at < p_to AND (p_site IS NULL OR o.site_id = p_site)
  GROUP BY b.id, b.code, b.name, c.name
  HAVING count(*) FILTER (WHERE i.result='at_risk') > 0
  ORDER BY 5 DESC LIMIT p_limit;
$$;

-- Snapshots periódicos (para tendencias baratas; los llena un job nocturno)
CREATE TABLE kpi_snapshots (
  id           bigserial PRIMARY KEY,
  site_id      uuid REFERENCES sites(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  metric       text NOT NULL,         -- safe_behavior_rate_pct, avg_capa_close_days, ...
  value        numeric,
  UNIQUE NULLS NOT DISTINCT (site_id, snapshot_date, metric)
);
CREATE INDEX idx_kpi_snap ON kpi_snapshots(metric, snapshot_date DESC);
