import { DataSource, EntityManager } from 'typeorm';

/**
 * Ejecuta fn en una transacción y fija app.current_user_id para que los triggers
 * de auditoría (db/migrations/008) registren al actor real.
 */
export async function withActor<T>(ds: DataSource, actorId: string | null, fn: (m: EntityManager) => Promise<T>): Promise<T> {
  return ds.transaction(async (m) => {
    await m.query(`SELECT set_config('app.current_user_id', $1, true)`, [actorId ?? '']);
    return fn(m);
  });
}
