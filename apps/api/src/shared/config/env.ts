export function resolveAccessTokenSecret(env: NodeJS.ProcessEnv = process.env) {
  const secret = env.ACCESS_TOKEN_SECRET?.trim();
  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET must be configured.");
  }

  return secret;
}

export function resolvePort(env: NodeJS.ProcessEnv = process.env) {
  if (env.PORT === undefined) {
    return 3000;
  }

  const port = Number(env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid port number.");
  }

  return port;
}
