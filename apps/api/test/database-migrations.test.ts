import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../database/migrations",
);

const readMigration = async (fileName: string) =>
  readFile(join(migrationsDir, fileName), "utf8");

describe("database migrations", () => {
  it("keeps 010_create_providers forward-safe for already-migrated databases", async () => {
    const sql = await readMigration("010_create_providers.sql");

    expect(sql).toContain("CREATE TABLE providers");
    expect(sql).toContain("'provider-mercadona'");
    expect(sql).not.toContain("'provider-bonpreuesclat'");
  });

  it("keeps 011_add_lists_provider_fk aligned with providers.id FK wiring", async () => {
    const sql = await readMigration("011_add_lists_provider_fk.sql");

    expect(sql).toContain("ADD COLUMN IF NOT EXISTS provider_id TEXT");
    expect(sql).toContain("REFERENCES providers(id)");
    expect(sql).toContain("WHERE slug = 'mercadona'");
  });

  it("adds Bonpreu through a new forward-only backfill migration", async () => {
    const sql = await readMigration("012_backfill_bonpreu_provider.sql");

    expect(sql).toContain("INSERT INTO providers (id, slug, display_name)");
    expect(sql).toContain("'provider-bonpreuesclat'");
    expect(sql).toContain("ON CONFLICT (slug) DO UPDATE");
    expect(sql).toContain("WHERE provider_id = 'bonpreuesclat'");
  });
});
