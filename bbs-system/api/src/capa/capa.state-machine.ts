import type { CapaStatus } from '../common/enums';

/**
 * Máquina de estados de CAPA:
 *   open -> in_progress -> verification -> closed
 *                 ^______________|  (verificación no eficaz o rechazo: vuelve a in_progress)
 *   open | in_progress | verification -> cancelled (solo gerentes, con motivo)
 * 'closed' solo se alcanza registrando una verificación de eficacia positiva
 * (POST /capa/:id/verifications), nunca por transición directa.
 */
export const CAPA_TRANSITIONS: Record<CapaStatus, readonly CapaStatus[]> = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['verification', 'cancelled'],
  verification: ['in_progress', 'closed', 'cancelled'],
  closed: [],
  cancelled: [],
};

export const ACTIVE_CAPA_STATUSES: readonly CapaStatus[] = ['open', 'in_progress', 'verification'];

export function canTransition(from: CapaStatus, to: CapaStatus): boolean {
  return CAPA_TRANSITIONS[from].includes(to);
}

/** Transiciones que NO se pueden pedir directamente por el endpoint /transition. */
export function isDirectTransitionAllowed(from: CapaStatus, to: CapaStatus): boolean {
  return canTransition(from, to) && to !== 'closed';
}
