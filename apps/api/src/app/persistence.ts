import type { ListRepository } from "@src/modules/lists/application/ports.js";
import { InMemoryListRepository } from "@src/modules/lists/infrastructure/InMemoryListRepository.js";
import { PostgresListRepository } from "@src/modules/lists/infrastructure/PostgresListRepository.js";
import type { UserRepository } from "@src/modules/users/application/ports.js";
import { InMemoryUserRepository } from "@src/modules/users/infrastructure/InMemoryUserRepository.js";
import { PostgresUserRepository } from "@src/modules/users/infrastructure/PostgresUserRepository.js";
import type { RefreshTokenStore } from "@src/modules/auth/application/ports.js";
import { InMemoryRefreshTokenStore } from "@src/modules/auth/infrastructure/InMemoryRefreshTokenStore.js";
import { PostgresRefreshTokenStore } from "@src/modules/auth/infrastructure/PostgresRefreshTokenStore.js";
import { getPgPool } from "@src/infrastructure/database/pgConnection.js";

export type PersistenceProvider = "postgres" | "inmemory";

export type PersistenceLayer = {
  provider: PersistenceProvider;
  userRepository: UserRepository;
  listRepository: ListRepository;
  refreshTokenStore: RefreshTokenStore;
};

export function resolvePersistenceProvider(
  env: NodeJS.ProcessEnv = process.env,
): PersistenceProvider {
  const explicit = env.DB_PROVIDER;

  if (explicit === "postgres" || explicit === "inmemory") {
    return explicit;
  }

  if (env.NODE_ENV === "test" || env.VITEST) {
    return "inmemory";
  }

  return "postgres";
}

export function createPersistenceLayer(
  env: NodeJS.ProcessEnv = process.env,
): PersistenceLayer {
  const provider = resolvePersistenceProvider(env);

  if (provider === "postgres") {
    const pool = getPgPool();

    return {
      provider,
      userRepository: new PostgresUserRepository(pool),
      listRepository: new PostgresListRepository(pool),
      refreshTokenStore: new PostgresRefreshTokenStore(pool),
    };
  }

  return {
    provider,
    userRepository: new InMemoryUserRepository(),
    listRepository: new InMemoryListRepository(),
    refreshTokenStore: new InMemoryRefreshTokenStore(),
  };
}
