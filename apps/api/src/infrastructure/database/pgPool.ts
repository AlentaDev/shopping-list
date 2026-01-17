import { createRequire } from "node:module";

type PgPoolOptions = {
  connectionString?: string;
};

export function createPgPool(options: PgPoolOptions = {}) {
  const connectionString =
    options.connectionString ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create a PostgreSQL pool.");
  }

  const require = createRequire(import.meta.url);
  const { Pool } = require("pg");

  return new Pool({
    connectionString,
  });
}
