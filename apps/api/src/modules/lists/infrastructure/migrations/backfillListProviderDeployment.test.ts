import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("deployment backfill migration", () => {
  it("ships the legacy provider backfill in the database migration path", async () => {
    const migrationPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../../../../database/migrations/013_backfill_list_provider.sql",
    );

    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("UPDATE lists");
    expect(sql).toContain("SET provider_id = 'provider-mercadona'");
  });

  it("treats padded legacy mercadona ownership as backfillable in deployment SQL", async () => {
    const migrationPath = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../../../../database/migrations/013_backfill_list_provider.sql",
    );

    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain("provider_id IS NULL");
    expect(sql).toContain("btrim(provider_id) = ''");
    expect(sql).toContain("btrim(provider_id) = 'mercadona'");
  });

  it("keeps module-local rollout SQL aligned with deployment SQL trimming semantics", async () => {
    const migrationsDir = dirname(fileURLToPath(import.meta.url));
    const moduleSql = await readFile(
      join(migrationsDir, "20260523_backfill_list_provider.sql"),
      "utf8",
    );
    const deploymentSql = await readFile(
      join(
        migrationsDir,
        "../../../../../database/migrations/013_backfill_list_provider.sql",
      ),
      "utf8",
    );

    expect(moduleSql).toContain("btrim(provider_id) = 'mercadona'");
    expect(deploymentSql).toContain("btrim(provider_id) = 'mercadona'");
  });
});
