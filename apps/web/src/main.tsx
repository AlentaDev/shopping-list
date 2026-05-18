import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "@src/App";
import { initSentry } from "@src/infrastructure/observability/sentry";
import { AppProviders } from "@src/providers/AppProviders";
import { AppErrorFallback } from "@src/shared/components/error/AppErrorFallback";

initSentry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<AppErrorFallback />}>
      <AppProviders>
        <App />
      </AppProviders>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
