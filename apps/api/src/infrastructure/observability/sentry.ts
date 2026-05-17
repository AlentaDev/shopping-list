import * as Sentry from "@sentry/node";

const FALLBACK_ENVIRONMENT = "development";

const resolveSentryEnvironment = () =>
  process.env.NODE_ENV ?? FALLBACK_ENVIRONMENT;

const resolveSentryRelease = () => process.env.SENTRY_RELEASE;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: resolveSentryEnvironment(),
    release: resolveSentryRelease(),
  });
}
