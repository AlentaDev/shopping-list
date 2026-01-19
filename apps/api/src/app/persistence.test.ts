import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPersistenceLayer, resolvePersistenceProvider } from "./persistence.js";
import { InMemoryUserRepository } from "@src/modules/users/infrastructure/InMemoryUserRepository.js";
import { PostgresUserRepository } from "@src/modules/users/infrastructure/PostgresUserRepository.js";
import { InMemoryListRepository } from "@src/modules/lists/infrastructure/InMemoryListRepository.js";
import { PostgresListRepository } from "@src/modules/lists/infrastructure/PostgresListRepository.js";
import { InMemoryRefreshTokenStore } from "@src/modules/auth/infrastructure/InMemoryRefreshTokenStore.js";
import { PostgresRefreshTokenStore } from "@src/modules/auth/infrastructure/PostgresRefreshTokenStore.js";
import { getPgPool } from "@src/infrastructure/database/pgConnection.js";

vi.mock("@src/infrastructure/database/pgConnection.js", () => ({
  getPgPool: vi.fn(() => ({ query: vi.fn() })),
}));

describe("resolvePersistenceProvider", () => {
  it("returns the explicit provider when configured", () => {
    expect(
      resolvePersistenceProvider({ DB_PROVIDER: "inmemory" } as NodeJS.ProcessEnv),
    ).toBe("inmemory");
    expect(
      resolvePersistenceProvider({ DB_PROVIDER: "postgres" } as NodeJS.ProcessEnv),
    ).toBe("postgres");
  });

  it("defaults to in-memory in test environments", () => {
    expect(
      resolvePersistenceProvider({ NODE_ENV: "test" } as NodeJS.ProcessEnv),
    ).toBe("inmemory");
    expect(
      resolvePersistenceProvider({ VITEST: "1" } as NodeJS.ProcessEnv),
    ).toBe("inmemory");
  });

  it("defaults to postgres in non-test environments", () => {
    expect(
      resolvePersistenceProvider({ NODE_ENV: "production" } as NodeJS.ProcessEnv),
    ).toBe("postgres");
  });
});

describe("createPersistenceLayer", () => {
  const mockedGetPgPool = vi.mocked(getPgPool);

  beforeEach(() => {
    mockedGetPgPool.mockClear();
  });

  it("creates in-memory adapters when configured", () => {
    const persistence = createPersistenceLayer({
      DB_PROVIDER: "inmemory",
    } as NodeJS.ProcessEnv);

    expect(persistence.userRepository).toBeInstanceOf(InMemoryUserRepository);
    expect(persistence.listRepository).toBeInstanceOf(InMemoryListRepository);
    expect(persistence.refreshTokenStore).toBeInstanceOf(
      InMemoryRefreshTokenStore,
    );
    expect(persistence.provider).toBe("inmemory");
    expect(mockedGetPgPool).not.toHaveBeenCalled();
  });

  it("creates postgres adapters when configured", () => {
    const persistence = createPersistenceLayer({
      DB_PROVIDER: "postgres",
    } as NodeJS.ProcessEnv);

    expect(persistence.userRepository).toBeInstanceOf(PostgresUserRepository);
    expect(persistence.listRepository).toBeInstanceOf(PostgresListRepository);
    expect(persistence.refreshTokenStore).toBeInstanceOf(PostgresRefreshTokenStore);
    expect(persistence.provider).toBe("postgres");
    expect(mockedGetPgPool).toHaveBeenCalledTimes(1);
  });
});
