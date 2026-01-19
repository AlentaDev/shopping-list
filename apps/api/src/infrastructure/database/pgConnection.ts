import { createPgPool } from "./pgPool.js";

let pool: ReturnType<typeof createPgPool> | null = null;

export function getPgPool() {
  if (!pool) {
    pool = createPgPool();
  }

  return pool;
}
