import { SignupUser } from "./application/signup";
import { LoginUser } from "./application/login";
import { GetCurrentUser } from "./application/me";
import { LogoutUser } from "./application/logout";
import { InMemoryUserRepository } from "./infrastructure/InMemoryUserRepository";
import { ScryptPasswordHasher } from "./infrastructure/ScryptPasswordHasher";
import { InMemorySessionStore } from "./infrastructure/InMemorySessionStore";
import { InMemoryRefreshTokenRepository } from "./infrastructure/InMemoryRefreshTokenRepository";
import { RandomTokenGenerator } from "./infrastructure/RandomTokenGenerator";
import { createAuthRouter } from "./web/authRouter";

export function createAuthModule() {
  const userRepository = new InMemoryUserRepository();
  const passwordHasher = new ScryptPasswordHasher();
  const sessionStore = new InMemorySessionStore();
  const refreshTokenRepository = new InMemoryRefreshTokenRepository();
  const tokenGenerator = new RandomTokenGenerator();

  const signupUser = new SignupUser(userRepository, passwordHasher);
  const loginUser = new LoginUser(
    userRepository,
    passwordHasher,
    sessionStore,
    refreshTokenRepository,
    tokenGenerator
  );
  const getCurrentUser = new GetCurrentUser(sessionStore, userRepository);
  const logoutUser = new LogoutUser(sessionStore);

  const router = createAuthRouter({
    signupUser,
    loginUser,
    getCurrentUser,
    logoutUser,
  });

  return { router, sessionStore };
}
