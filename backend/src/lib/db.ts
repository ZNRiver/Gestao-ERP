import { Pool, types } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Carrega o .env do diretório atual (ex: backend/.env) com prioridade;
// o .env global da raiz do projeto serve como fallback.
dotenv.config();
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..', '.env') });

// O pg retorna NUMERIC como string; converte para number (comportamento esperado pela API)
types.setTypeParser(1700, parseFloat);

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://erp:erp123@localhost:5432/erp';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
});

export async function query<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function queryOne<T = any>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Monta um UPDATE dinâmico a partir dos campos informados (ignora undefined).
 * Retorna SQL com $1 = id e params sem o id; use: queryOne(text, [id, ...params]).
 */
export function buildUpdateSql(table: string, payload: Record<string, any>, opts: { withUpdatedAt?: boolean } = {}) {
  const keys = Object.keys(payload).filter((k) => payload[k] !== undefined);
  if (keys.length === 0) throw new Error('Nenhum campo informado para atualização');
  const set = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const setWithTs = opts.withUpdatedAt ? `${set}, updated_at = now()` : set;
  return {
    text: `UPDATE ${table} SET ${setWithTs} WHERE id = $1 RETURNING *`,
    params: keys.map((k) => payload[k]),
  };
}
