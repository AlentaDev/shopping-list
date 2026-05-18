import * as Sentry from "@sentry/react";

const resolveEnvironment = () => import.meta.env.MODE ?? "development";

const resolveRelease = () => import.meta.env.VITE_SENTRY_RELEASE;

export const getSentryDsn = () => import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  const dsn = getSentryDsn();

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: resolveEnvironment(),
    release: resolveRelease(),
    sendDefaultPii: true,
  });
}
