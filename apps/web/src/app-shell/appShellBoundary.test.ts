import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { AppShell as canonicalAppShell } from "@src/app-shell/AppShell";
import { AppShell as compatibilityAppShell } from "../features/app-shell";

const WEB_SRC_ROOT = join(__dirname, "..");
const ALLOWED_FALLBACK_FILE = "features/app-shell/index.ts";
const LEGACY_APP_SHELL_DIR = join(WEB_SRC_ROOT, "features", "app-shell");
const ALLOWED_FEATURE_APP_SHELL_FILES = ["index.ts"] as const;

const LEGACY_TEST_FILES = [
  "AppShell.test.tsx",
  "AppShell.editing-session.test.tsx",
  "useAppShellNavigation.test.tsx",
] as const;

const CANONICAL_TEST_FILES = [
  "app-shell/AppShell.test.tsx",
  "app-shell/AppShell.editing-session.test.tsx",
  "app-shell/AppShell.legacy.test.tsx",
  "app-shell/useAppShellNavigation.test.ts",
  "app-shell/useAppShellNavigation.legacy.test.tsx",
] as const;

const listSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(absolutePath));
      continue;
    }

    if (absolutePath.endsWith(".ts") || absolutePath.endsWith(".tsx")) {
      files.push(absolutePath);
    }
  }

  return files;
};

describe("app shell compatibility entrypoint", () => {
  it("re-exports the canonical app-shell from feature fallback index", () => {
    expect(compatibilityAppShell).toBe(canonicalAppShell);
  });

  it("blocks new ambiguous imports to features/app-shell outside fallback index", () => {
    const forbiddenImportPattern = /from\s+["']@src\/features\/app-shell(\/[^"']*)?["']/;

    const offenders = listSourceFiles(WEB_SRC_ROOT)
      .map((filePath) => ({
        filePath,
        relativePath: relative(WEB_SRC_ROOT, filePath).replaceAll("\\", "/"),
        content: readFileSync(filePath, "utf-8"),
      }))
      .filter(({ relativePath, content }) => {
        if (relativePath === ALLOWED_FALLBACK_FILE) {
          return false;
        }

        return forbiddenImportPattern.test(content);
      })
      .map(({ relativePath }) => relativePath);

    expect(offenders).toEqual([]);
  });

  it("requires legacy app-shell tests to live in canonical app-shell tree", () => {
    const legacyEntries = readdirSync(LEGACY_APP_SHELL_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);

    expect(legacyEntries).not.toEqual(expect.arrayContaining([...LEGACY_TEST_FILES]));

    const sourceFiles = listSourceFiles(WEB_SRC_ROOT).map((absolutePath) =>
      relative(WEB_SRC_ROOT, absolutePath).replaceAll("\\", "/"),
    );

    expect(sourceFiles).toEqual(expect.arrayContaining([...CANONICAL_TEST_FILES]));
  });

  it("requires feature app-shell cleanup except fallback index", () => {
    const featureFiles = listSourceFiles(LEGACY_APP_SHELL_DIR)
      .map((absolutePath) =>
        relative(LEGACY_APP_SHELL_DIR, absolutePath).replaceAll("\\", "/"),
      )
      .sort();

    expect(featureFiles).toEqual([...ALLOWED_FEATURE_APP_SHELL_FILES].sort());
  });

  it("blocks app-shell imports from feature service internals", () => {
    const APP_SHELL_DIR = join(WEB_SRC_ROOT, "app-shell");
    const forbiddenImportPattern =
      /from\s+["']@src\/features\/[^/]+\/services(?:\/[^"']*)?["']/;

    const offenders = listSourceFiles(APP_SHELL_DIR)
      .map((filePath) => ({
        relativePath: relative(WEB_SRC_ROOT, filePath).replaceAll("\\", "/"),
        content: readFileSync(filePath, "utf-8"),
      }))
      .filter(({ relativePath, content }) => {
        const isTestFile = relativePath.endsWith(".test.ts") || relativePath.endsWith(".test.tsx");

        if (isTestFile) {
          return false;
        }

        return forbiddenImportPattern.test(content);
      })
      .map(({ relativePath }) => relativePath);

    expect(offenders).toEqual([]);
  });
});
