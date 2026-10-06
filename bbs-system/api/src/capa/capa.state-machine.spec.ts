import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, isDirectTransitionAllowed } from './capa.state-machine.ts';

test('flujo feliz open -> in_progress -> verification -> closed', () => {
  assert.ok(canTransition('open', 'in_progress'));
  assert.ok(canTransition('in_progress', 'verification'));
  assert.ok(canTransition('verification', 'closed'));
});

test('no se puede saltar etapas ni reabrir estados finales', () => {
  assert.equal(canTransition('open', 'verification'), false);
  assert.equal(canTransition('open', 'closed'), false);
  assert.equal(canTransition('in_progress', 'closed'), false);
  assert.equal(canTransition('closed', 'in_progress'), false);
  assert.equal(canTransition('cancelled', 'open'), false);
});

test('verificación no eficaz regresa a in_progress; cierre directo prohibido', () => {
  assert.ok(canTransition('verification', 'in_progress'));
  assert.equal(isDirectTransitionAllowed('verification', 'closed'), false);
});
