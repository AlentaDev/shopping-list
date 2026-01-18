import { readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createPgPool } from "../src/infrastructure/database/pgPool.js";

type MigrationRecord = {
  id: string;
};

const MIGRATIONS_TABLE = "schema_migrations";

export async function runMigrations() {
  const pool = createPgPool();
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
    );

    const applied = await pool.query<MigrationRecord>(
      `SELECT id FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`,
    );
    const appliedIds = new Set(applied.rows.map((row) => row.id));

    const migrationsDir = join(
      fileURLToPath(new URL(".", import.meta.url)),
      "migrations",
    );
    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const id = basename(file);
      if (appliedIds.has(id)) {
        continue;
      }

      const sql = await readFile(join(migrationsDir, file), "utf8");

      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query(`INSERT INTO ${MIGRATIONS_TABLE} (id) VALUES ($1)`, [
          id,
        ]);
        await pool.query("COMMIT");
      } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await pool.end();
  }
}

const isDirectRun =
  import.meta.url === pathToFileURL(process.argv[1] ?? "").href;

if (isDirectRun) {
  runMigrations().catch((error) => {
    console.error("Failed to run migrations", error);
    process.exitCode = 1;
  });
}
