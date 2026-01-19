import { readFile, readdir } from "node:fs/promises";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createPgPool } from "../src/infrastructure/database/pgPool.js";
import { canResetDatabase, runMigrations } from "./migrator.js";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
}));

vi.mock("../src/infrastructure/database/pgPool.js", () => ({
  createPgPool: vi.fn(),
}));

describe("runMigrations", () => {
  const mockedReadFile = vi.mocked(readFile);
  const mockedReaddir = vi.mocked(readdir);
  const mockedCreatePgPool = vi.mocked(createPgPool);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("logs applied migrations", async () => {
    mockedReaddir.mockResolvedValue(["001_init.sql"]);
    mockedReadFile.mockResolvedValue("SELECT 1;");

    const query = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    const end = vi.fn().mockResolvedValue(undefined);

    mockedCreatePgPool.mockReturnValue({ query, end } as never);

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await runMigrations();

    expect(infoSpy).toHaveBeenCalledWith(
      "[migrator] Applying migration 001_init.sql",
    );
    expect(infoSpy).toHaveBeenCalledWith(
      "[migrator] Applied migration 001_init.sql",
    );
  });

  it("logs when there are no pending migrations", async () => {
    mockedReaddir.mockResolvedValue(["001_init.sql"]);

    const query = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: "001_init.sql" }] });
    const end = vi.fn().mockResolvedValue(undefined);

    mockedCreatePgPool.mockReturnValue({ query, end } as never);

    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    await runMigrations();

    expect(infoSpy).toHaveBeenCalledWith("[migrator] No pending migrations.");
    expect(mockedReadFile).not.toHaveBeenCalled();
  });
});

describe("canResetDatabase", () => {
  it("allows resets for test databases", () => {
    expect(
      canResetDatabase({ DB_NAME: "shopping_list_test" } as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it("allows resets when explicitly overridden", () => {
    expect(
      canResetDatabase({
        DB_NAME: "shopping_list",
        ALLOW_DB_RESET: "true",
      } as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it("blocks resets for non-test databases without override", () => {
    expect(
      canResetDatabase({ DB_NAME: "shopping_list" } as NodeJS.ProcessEnv),
    ).toBe(false);
  });
});
