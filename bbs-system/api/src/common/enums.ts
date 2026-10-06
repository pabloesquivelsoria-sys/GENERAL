export const BEHAVIOR_RESULTS = ['safe', 'at_risk', 'not_applicable'] as const;
export type BehaviorResult = (typeof BEHAVIOR_RESULTS)[number];

export const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Severity = (typeof SEVERITIES)[number];
export type Priority = Severity;

export const CAPA_STATUSES = ['open', 'in_progress', 'verification', 'closed', 'cancelled'] as const;
export type CapaStatus = (typeof CAPA_STATUSES)[number];

export const CAPA_TYPES = ['corrective', 'preventive', 'containment'] as const;
export type CapaType = (typeof CAPA_TYPES)[number];

export const CAPA_SOURCES = ['observation', 'near_miss', 'audit', 'other'] as const;
export type CapaSource = (typeof CAPA_SOURCES)[number];

export const CONTROL_LEVELS = ['elimination', 'substitution', 'engineering', 'administrative', 'ppe'] as const;
export type ControlLevel = (typeof CONTROL_LEVELS)[number];

export const NEAR_MISS_STATUSES = ['reported', 'under_investigation', 'capa_assigned', 'closed'] as const;
export type NearMissStatus = (typeof NEAR_MISS_STATUSES)[number];

export const ALERT_TYPES = [
  'unsafe_behavior', 'repeat_unsafe_behavior', 'near_miss_reported',
  'capa_due_soon', 'capa_overdue', 'capa_escalated', 'verification_pending',
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ROLE_CODES = ['admin', 'ehs_manager', 'site_manager', 'supervisor', 'observer', 'capa_owner', 'viewer'] as const;
export type RoleCode = (typeof ROLE_CODES)[number];
