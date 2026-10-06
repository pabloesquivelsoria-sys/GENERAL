-- 010: trazabilidad de datos importados desde sistemas externos (p. ej. Benchmark / tablero OK)
ALTER TABLE capas
  ADD COLUMN external_source    text,
  ADD COLUMN external_id        text,
  ADD COLUMN external_payload   jsonb,
  ADD COLUMN external_synced_at timestamptz,
  ADD CONSTRAINT capas_external_pair CHECK ((external_source IS NULL) = (external_id IS NULL));
CREATE UNIQUE INDEX uq_capas_external ON capas(external_source, external_id) WHERE external_source IS NOT NULL;

CREATE TABLE import_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source      text NOT NULL,
  entity      text NOT NULL DEFAULT 'capa',
  actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  dry_run     boolean NOT NULL DEFAULT false,
  total       int NOT NULL DEFAULT 0,
  inserted    int NOT NULL DEFAULT 0,
  updated     int NOT NULL DEFAULT 0,
  failed      int NOT NULL DEFAULT 0,
  errors      jsonb NOT NULL DEFAULT '[]'::jsonb,
  warnings    jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_import_runs_created ON import_runs(created_at DESC);
