import { SignupUser } from "./application/signup";
import { LoginUser } from "./application/login";
import { GetCurrentUser } from "./application/me";
import { LogoutUser } from "./application/logout";
import { RegisterWithTokens } from "./application/registerWithTokens";
import { LoginWithTokens } from "./application/loginWithTokens";
import { RefreshAccessToken } from "./application/refreshAccessToken";
import { InMemoryUserRepository } from "./infrastructure/InMemoryUserRepository";
import { ScryptPasswordHasher } from "./infrastructure/ScryptPasswordHasher";
import { InMemorySessionStore } from "./infrastructure/InMemorySessionStore";
import { InMemoryRefreshTokenStore } from "./infrastructure/InMemoryRefreshTokenStore";
import { JwtAccessTokenService } from "./infrastructure/JwtAccessTokenService";
import { SystemClock } from "./infrastructure/SystemClock";
import { createAuthRouter } from "./web/authRouter";

export function createAuthModule() {
  const userRepository = new InMemoryUserRepository();
  const passwordHasher = new ScryptPasswordHasher();
  const sessionStore = new InMemorySessionStore();
  const refreshTokenStore = new InMemoryRefreshTokenStore();
  const accessTokenService = new JwtAccessTokenService(
    process.env.ACCESS_TOKEN_SECRET ?? "dev-access-token-secret"
  );
  const clock = new SystemClock();

  const signupUser = new SignupUser(userRepository, passwordHasher);
  const loginUser = new LoginUser(userRepository, passwordHasher, sessionStore);
  const getCurrentUser = new GetCurrentUser(sessionStore, userRepository);
  const logoutUser = new LogoutUser(sessionStore);

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
    signupUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    registerWithTokens,
    loginWithTokens,
    refreshAccessToken,
  });

  return { router, sessionStore };
}
