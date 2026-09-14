import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL not set – falling back to in‑memory stores (development only).');
}

export const db = connectionString
  ? new Pool({ connectionString })
  : null;

/**
 * Helper to run a query with optional parameters.
 * Returns rows typed as generic `T`.
 */
export async function query<T>(text: string, params?: any[]): Promise<T[]> {
  if (!db) {
    throw new Error('Database not configured – cannot execute query.');
  }
  const client = await db.connect();
  try {
    const res = await client.query<T>(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}
