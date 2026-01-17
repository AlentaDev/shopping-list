import { createRequire } from "node:module";

type PgPoolOptions = {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
};

export function createPgPool(options: PgPoolOptions = {}) {
  const host = options.host ?? process.env.DB_HOST;
  const port =
    options.port ?? (process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432);
  const database = options.database ?? process.env.DB_NAME;
  const user = options.user ?? process.env.DB_USER;
  const password = options.password ?? process.env.DB_PASSWORD;
  const ssl =
    options.ssl ??
    (process.env.DB_SSL ? process.env.DB_SSL === "true" : false);

  if (!host || !database || !user || !password) {
    throw new Error(
      "DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD are required to create a PostgreSQL pool.",
    );
  }

  if (Number.isNaN(port) || port <= 0) {
    throw new Error("DB_PORT must be a valid positive number.");
  }

  const require = createRequire(import.meta.url);
  const { Pool } = require("pg");

  return new Pool({
    host,
    port,
    database,
    user,
    password,
    ssl,
  });
}
