import { readFileSync } from 'fs';
import { CapaStatus, Priority } from '../common/enums';

/**
 * Mapeo de la exportación de Benchmark (tablero OK) a CAPA.
 * Las cabeceras se normalizan (minúsculas, sin acentos, no alfanumérico -> "_") antes de buscar alias.
 * Para ajustar a la exportación real sin tocar código: BENCHMARK_MAPPING_FILE=/ruta/mapping.json
 * (mismo formato: { "aliases": {...}, "status": {...}, "priority": {...} }, se fusiona con los valores por defecto).
 */
export interface BenchmarkMapping {
  aliases: Record<'external_id' | 'title' | 'description' | 'owner' | 'due_date' | 'created_at' | 'closed_at' | 'status' | 'priority' | 'site' | 'area' | 'root_cause', string[]>;
  status: Record<string, CapaStatus>;
  priority: Record<string, Priority>;
}

const DEFAULT: BenchmarkMapping = {
  aliases: {
    external_id: ['id', 'id_accion', 'accion_id', 'action_id', 'numero', 'folio', 'codigo', 'ref', 'referencia'],
    title: ['titulo', 'title', 'accion', 'action', 'nombre', 'resumen'],
    description: ['descripcion', 'description', 'detalle', 'comentarios', 'actividad'],
    owner: ['responsable', 'owner', 'asignado', 'asignado_a', 'assigned_to', 'responsable_email', 'email_responsable'],
    due_date: ['fecha_compromiso', 'fecha_limite', 'fecha_vencimiento', 'due_date', 'deadline', 'fecha_objetivo', 'target_date'],
    created_at: ['fecha_creacion', 'fecha_alta', 'created', 'created_at', 'fecha_apertura', 'fecha'],
    closed_at: ['fecha_cierre', 'closed_at', 'fecha_cerrado', 'completed_date'],
    status: ['estatus', 'estado', 'status', 'situacion'],
    priority: ['prioridad', 'priority', 'severidad', 'criticidad'],
    site: ['sitio', 'planta', 'site', 'location', 'ubicacion', 'facility'],
    area: ['area', 'departamento', 'department', 'zona'],
    root_cause: ['causa_raiz', 'root_cause', 'causa'],
  },
  status: {
    abierto: 'open', abierta: 'open', open: 'open', nuevo: 'open', nueva: 'open', pendiente: 'open', 'sin_iniciar': 'open', not_started: 'open',
    en_proceso: 'in_progress', 'en_progreso': 'in_progress', in_progress: 'in_progress', 'en_curso': 'in_progress', atrasado: 'in_progress', atrasada: 'in_progress', vencido: 'in_progress', vencida: 'in_progress', overdue: 'in_progress',
    en_verificacion: 'verification', verificacion: 'verification', por_verificar: 'verification', verification: 'verification', 'en_revision': 'verification',
    cerrado: 'closed', cerrada: 'closed', closed: 'closed', completado: 'closed', completada: 'closed', completed: 'closed', terminado: 'closed', terminada: 'closed', done: 'closed', ok: 'closed',
    cancelado: 'cancelled', cancelada: 'cancelled', cancelled: 'cancelled', canceled: 'cancelled',
  },
  priority: {
    baja: 'low', bajo: 'low', low: 'low', '3': 'low', verde: 'low',
    media: 'medium', medio: 'medium', normal: 'medium', medium: 'medium', '2': 'medium', amarillo: 'medium',
    alta: 'high', alto: 'high', high: 'high', '1': 'high', naranja: 'high',
    critica: 'critical', critico: 'critical', critical: 'critical', urgente: 'critical', '0': 'critical', rojo: 'critical',
  },
};

export function loadMapping(): BenchmarkMapping {
  const file = process.env.BENCHMARK_MAPPING_FILE;
  if (!file) return DEFAULT;
  const o = JSON.parse(readFileSync(file, 'utf8')) as Partial<BenchmarkMapping>;
  const aliases = { ...DEFAULT.aliases } as BenchmarkMapping['aliases'];
  for (const [k, v] of Object.entries(o.aliases ?? {})) (aliases as Record<string, string[]>)[k] = v;
  return { aliases, status: { ...DEFAULT.status, ...o.status }, priority: { ...DEFAULT.priority, ...o.priority } };
}

export const norm = (s: unknown): string =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
