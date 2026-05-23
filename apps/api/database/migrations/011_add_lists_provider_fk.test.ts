import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("011_add_lists_provider_fk.sql", () => {
  it("adds lists.provider_id as real FK to providers.id", async () => {
    const migrationPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "011_add_lists_provider_fk.sql",
    );

    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("ADD COLUMN IF NOT EXISTS provider_id TEXT");
    expect(sql).toContain("ALTER COLUMN provider_id SET NOT NULL");
    expect(sql).toContain("FOREIGN KEY (provider_id)");
    expect(sql).toContain("REFERENCES providers(id)");
  });

  it("backfills legacy provider mapping to mercadona provider id", async () => {
    const migrationPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "011_add_lists_provider_fk.sql",
    );

    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("WHERE slug = 'mercadona'");
    expect(sql).toContain("provider_id = 'mercadona'");
  });
});
