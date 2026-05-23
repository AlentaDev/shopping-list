import { LogoutTokens } from "./application/logoutTokens.js";
import { RegisterWithTokens } from "./application/registerWithTokens.js";
import { LoginWithTokens } from "./application/loginWithTokens.js";
import { RefreshAccessToken } from "./application/refreshAccessToken.js";
import type { UserRepository } from "@src/modules/users/public.js";
import { InMemoryUserRepository } from "@src/modules/users/public.js";
import { ScryptPasswordHasher } from "./infrastructure/ScryptPasswordHasher.js";
import { InMemoryRefreshTokenStore } from "./infrastructure/InMemoryRefreshTokenStore.js";
import { JwtAccessTokenService } from "./infrastructure/JwtAccessTokenService.js";
import { SystemClock } from "./infrastructure/SystemClock.js";
import { createAuthRouter } from "./api/authRouter.js";
import type { RefreshTokenStore } from "./application/ports.js";
import { resolveAccessTokenSecret } from "@src/shared/config/env.js";

type AuthModuleDependencies = {
  userRepository?: UserRepository;
  refreshTokenStore?: RefreshTokenStore;
};

export function createAuthModule(deps: AuthModuleDependencies = {}) {
  const userRepository = deps.userRepository ?? new InMemoryUserRepository();
  const passwordHasher = new ScryptPasswordHasher();
  const refreshTokenStore =
    deps.refreshTokenStore ?? new InMemoryRefreshTokenStore();
  const accessTokenService = new JwtAccessTokenService(
    resolveAccessTokenSecret(),
  );
  const clock = new SystemClock();

  const logoutTokens = new LogoutTokens(refreshTokenStore);

  const registerWithTokens = new RegisterWithTokens(
    userRepository,
    passwordHasher,
    accessTokenService,
    refreshTokenStore,
    clock,
  );
  const loginWithTokens = new LoginWithTokens(
    userRepository,
    passwordHasher,
    accessTokenService,
    refreshTokenStore,
    clock,
  );
  const refreshAccessToken = new RefreshAccessToken(
    accessTokenService,
    refreshTokenStore,
    clock,
  );

  const router = createAuthRouter({
    logoutTokens,
    registerWithTokens,
    loginWithTokens,
    refreshAccessToken,
  });

  return { router, userRepository };
}
