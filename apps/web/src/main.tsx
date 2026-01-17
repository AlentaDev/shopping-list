import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "@src/App";
import { AppProviders } from "@src/providers/AppProviders";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
