import { describe, expect, it } from "vitest";
import {
  collectModuleDependencySpecifiers,
  resolveImportTarget,
  violatesAppShellFeatureBoundary,
  violatesCrossFeatureInternalBoundary,
} from "./appShellImportBoundary";

describe("appShellImportBoundary", () => {
  it("collects imports, re-exports, vi mocks, and configured aliases without fixture-string false positives", () => {
    const content = `
      import { Catalog } from "@src/features/catalog";
      export { Lists } from "@src/features/lists";
      export * from "../features/shopping-list/services/registerBoundaryProbe";
      import "@/features/lists/services/registerBoundaryProbe";
      import type { AuthUser } from "../features/auth/services/AuthService";
      vi.mock("@src/features/shopping-list/services/LocalDraftSyncService", () => ({
        syncLocalDraftToRemoteList: vi.fn(),
      }));

      const fixture = `
        vi.mock("@src/features/catalog/services/ShouldStayInvisible", () => ({}));
      `;
    `;

    expect(collectModuleDependencySpecifiers(content)).toEqual([
      "@src/features/catalog",
      "@src/features/lists",
      "../features/shopping-list/services/registerBoundaryProbe",
      "@/features/lists/services/registerBoundaryProbe",
      "../features/auth/services/AuthService",
      "@src/features/shopping-list/services/LocalDraftSyncService",
    ]);
  });

  it("flags feature internals imported from app-shell files", () => {
    expect(
      violatesAppShellFeatureBoundary(
        "app-shell/useAppShellNavigation.test.ts",
        resolveImportTarget(
          "app-shell/useAppShellNavigation.test.ts",
          "@/features/lists/services/registerBoundaryProbe",
        ),
      ),
    ).toBe(true);

    expect(
      violatesAppShellFeatureBoundary(
        "app-shell/useAppShellNavigation.ts",
        resolveImportTarget("app-shell/useAppShellNavigation.ts", "@src/features/lists"),
      ),
    ).toBe(false);
  });

  it("flags cross-feature internal imports but allows public entrypoints", () => {
    expect(
      violatesCrossFeatureInternalBoundary(
        "features/lists/components/ListsScreen.tsx",
        resolveImportTarget(
          "features/lists/components/ListsScreen.tsx",
          "../../shopping-list/services/groupItemsByCategory",
        ),
      ),
    ).toBe(true);

    expect(
      violatesCrossFeatureInternalBoundary(
        "features/lists/components/ListsScreen.tsx",
        resolveImportTarget(
          "features/lists/components/ListsScreen.tsx",
          "@src/features/shopping-list",
        ),
      ),
    ).toBe(false);
  });
});
