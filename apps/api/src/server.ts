import { createApp } from "@src/app.js";
import { initSentry } from "@src/infrastructure/observability/sentry.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

initSentry();

const app = createApp();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
});
