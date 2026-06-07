import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("012_backfill_bonpreu_provider.sql", () => {
  it("adds Bonpreu as a forward-only provider seed", async () => {
    const migrationPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "012_backfill_bonpreu_provider.sql",
    );

    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("INSERT INTO providers (id, slug, display_name)");
    expect(sql).toContain("'provider-bonpreuesclat'");
    expect(sql).toContain("'bonpreuesclat'");
    expect(sql).toContain("'Bonpreu Esclat'");
    expect(sql).toContain("ON CONFLICT (slug) DO UPDATE");
  });

  it("backfills legacy list provider slugs to the Bonpreu provider FK id", async () => {
    const migrationPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "012_backfill_bonpreu_provider.sql",
    );

    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("SELECT id FROM providers WHERE slug = 'bonpreuesclat'");
    expect(sql).toContain("WHERE provider_id = 'bonpreuesclat'");
  });
});
