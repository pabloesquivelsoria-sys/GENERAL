-- 001: extensiones y tipos enumerados
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE behavior_result AS ENUM ('safe', 'at_risk', 'not_applicable');
CREATE TYPE observation_status AS ENUM ('draft', 'submitted', 'reviewed', 'archived');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE near_miss_status AS ENUM ('reported', 'under_investigation', 'capa_assigned', 'closed');
CREATE TYPE capa_type AS ENUM ('corrective', 'preventive', 'containment');
CREATE TYPE capa_status AS ENUM ('open', 'in_progress', 'verification', 'closed', 'cancelled');
CREATE TYPE capa_source AS ENUM ('observation', 'near_miss', 'audit', 'other');
CREATE TYPE hierarchy_control AS ENUM ('elimination', 'substitution', 'engineering', 'administrative', 'ppe');
CREATE TYPE alert_status AS ENUM ('open', 'acknowledged', 'resolved');
CREATE TYPE alert_type AS ENUM (
  'unsafe_behavior', 'repeat_unsafe_behavior', 'near_miss_reported',
  'capa_due_soon', 'capa_overdue', 'capa_escalated', 'verification_pending'
);
CREATE TYPE notification_channel AS ENUM ('in_app', 'websocket', 'email');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'TRANSITION');

-- trigger genérico updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE SEQUENCE obs_seq;
CREATE SEQUENCE nm_seq;
CREATE SEQUENCE capa_seq;
