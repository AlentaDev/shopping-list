import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), visualizer({ open: true, gzipSize: true })],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  test: {
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "e2e"],
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "e2e/",
        "src/test/",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/*.config.{ts,js}",
        "**/index.ts",
        // INFRASTRUCTURE (0%): TypeScript auto-validable
        "src/infrastructure/**",
        "src/providers/**",
        "src/main.tsx",
      ],
      thresholds: {
        // IMPORTANT (80%): Features visibles (UI y lógica de presentación)
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
        // CORE (100%): Código que maneja estado crítico y lógica de negocio
        // Se valida manualmente por archivo en servicios y contextos clave
      },
    },
  },
});
