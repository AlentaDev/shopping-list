import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("010_create_providers.sql", () => {
  it("creates providers with unique slug and mercadona seed", async () => {
    const migrationPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "010_create_providers.sql",
    );

    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("CREATE TABLE providers");
    expect(sql).toContain("slug TEXT NOT NULL UNIQUE");
    expect(sql).toContain("display_name TEXT NOT NULL");
    expect(sql).toContain("INSERT INTO providers (id, slug, display_name)");
    expect(sql).toContain("'mercadona'");
    expect(sql).toContain("'Mercadona'");
  });
});
