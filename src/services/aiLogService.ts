import { supabase } from './supabase';

export interface AiLogPayload {
  query: string;
  source?: 'client' | 'admin_audit';
  userId?: string | null;
  category?: string;
  resultsCount?: number;
  responseTimeMs?: number;
}

export interface ParsedAiLog {
  id: string;
  query: string;
  source: 'client' | 'admin_audit';
  category?: string;
  resultsCount?: number;
  responseTimeMs?: number;
  timestamp: string;
  usuario_id: string | null;
  rawDate: string;
}

/**
 * Registra una consulta real realizada a Sula AI en Supabase
 */
export async function logAiQuery({
  query,
  source = 'client',
  userId = null,
  category,
  resultsCount,
  responseTimeMs,
}: AiLogPayload): Promise<boolean> {
  try {
    if (!query || !query.trim()) return false;

    let resolvedUserId = userId;
    if (!resolvedUserId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        resolvedUserId = user?.id || null;
      } catch {
        resolvedUserId = null;
      }
    }

    const payloadData = {
      query: query.trim(),
      source,
      category: category || undefined,
      resultsCount: resultsCount ?? undefined,
      responseTimeMs: responseTimeMs ?? undefined,
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase.from('notificaciones').insert({
      usuario_id: resolvedUserId,
      titulo: 'CONSULTA_IA',
      cuerpo: JSON.stringify(payloadData),
      leido: true,
    });

    if (error) {
      console.warn('⚠️ No se pudo registrar la consulta de IA:', error.message);
      return false;
    }

    console.log(`✅ Consulta de IA registrada exitosamente (${source}): "${query.slice(0, 40)}..."`);
    return true;
  } catch (err) {
    console.warn('⚠️ Error al registrar consulta de IA:', err);
    return false;
  }
}

/**
 * Obtiene el conteo exacto de consultas de IA registradas en la base de datos
 */
export async function getAiQueriesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notificaciones')
      .select('*', { count: 'exact', head: true })
      .eq('titulo', 'CONSULTA_IA');

    if (error) throw error;
    return count || 0;
  } catch (err) {
    console.error('Error al obtener conteo de consultas IA:', err);
    return 0;
  }
}

/**
 * Parsea el cuerpo de una notificación tipo CONSULTA_IA
 */
export function parseAiLog(notificationRow: any): ParsedAiLog {
  let parsedContent: any = {};
  try {
    parsedContent = JSON.parse(notificationRow.cuerpo || '{}');
  } catch {
    parsedContent = { query: notificationRow.cuerpo || 'Consulta sin detalles' };
  }

  return {
    id: notificationRow.id,
    query: parsedContent.query || notificationRow.cuerpo || 'Consulta',
    source: parsedContent.source || 'client',
    category: parsedContent.category,
    resultsCount: parsedContent.resultsCount,
    responseTimeMs: parsedContent.responseTimeMs || parsedContent.latencyMs,
    timestamp: parsedContent.timestamp || notificationRow.fecha_creacion,
    usuario_id: notificationRow.usuario_id,
    rawDate: notificationRow.fecha_creacion,
  };
}
