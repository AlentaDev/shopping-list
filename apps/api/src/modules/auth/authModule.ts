import { GetCurrentUser } from "./application/me";
import { LogoutTokens } from "./application/logoutTokens";
import { RegisterWithTokens } from "./application/registerWithTokens";
import { LoginWithTokens } from "./application/loginWithTokens";
import { RefreshAccessToken } from "./application/refreshAccessToken";
import { InMemoryUserRepository } from "./infrastructure/InMemoryUserRepository";
import { ScryptPasswordHasher } from "./infrastructure/ScryptPasswordHasher";
import { InMemoryRefreshTokenStore } from "./infrastructure/InMemoryRefreshTokenStore";
import { JwtAccessTokenService } from "./infrastructure/JwtAccessTokenService";
import { SystemClock } from "./infrastructure/SystemClock";
import { createAuthRouter } from "./api/authRouter";

export function createAuthModule() {
  const userRepository = new InMemoryUserRepository();
  const passwordHasher = new ScryptPasswordHasher();
  const refreshTokenStore = new InMemoryRefreshTokenStore();
  const accessTokenService = new JwtAccessTokenService(
    process.env.ACCESS_TOKEN_SECRET ?? "dev-access-token-secret"
  );
  const clock = new SystemClock();

  const getCurrentUser = new GetCurrentUser(userRepository);
  const logoutTokens = new LogoutTokens(refreshTokenStore);

  const registerWithTokens = new RegisterWithTokens(
    userRepository,
    passwordHasher,
    accessTokenService,
    refreshTokenStore,
    clock
  );
  const loginWithTokens = new LoginWithTokens(
    userRepository,
    passwordHasher,
    accessTokenService,
    refreshTokenStore,
    clock
  );
  const refreshAccessToken = new RefreshAccessToken(
    accessTokenService,
    refreshTokenStore,
    clock
  );

  const router = createAuthRouter({
    getCurrentUser,
    logoutTokens,
    registerWithTokens,
    loginWithTokens,
    refreshAccessToken,
  });

  return { router };
}
