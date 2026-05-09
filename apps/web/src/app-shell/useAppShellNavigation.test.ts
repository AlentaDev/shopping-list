// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Catalog from "@src/features/catalog/Catalog";
import { ListsContainer } from "@src/features/lists";
import { AuthScreen } from "@src/features/auth";
import { MobileAppDownloadPage } from "@src/features/mobile-app";
import { useAppShellNavigation } from "@src/app-shell/useAppShellNavigation";

const baseArgs = {
  authUser: null,
  authRedirectPending: false,
  isAuthSubmitting: false,
  authError: null,
  isCategoriesOpen: false,
  linesCount: 0,
  onLogin: vi.fn(),
  onRegister: vi.fn(),
  onOpenList: vi.fn(),
  onStartOpenList: vi.fn(),
};

describe("useAppShellNavigation (canonical path)", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("resuelve /auth/* a flujo de auth", () => {
    window.history.pushState({}, "", "/auth/recover");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.authMode).toBe("login");
    expect(result.current.mainContent.type).toBe(AuthScreen);
  });

  it("renderiza catálogo en /", () => {
    const { result } = renderHook(() => useAppShellNavigation(baseArgs));
    expect(result.current.mainContent.type).toBe(Catalog);
  });

  it("renderiza listas en /lists con usuario", () => {
    window.history.pushState({}, "", "/lists");
    const { result } = renderHook(() =>
      useAppShellNavigation({
        ...baseArgs,
        authUser: {
          id: "user-1",
          name: "Ada",
          email: "ada@example.com",
          postalCode: "28001",
        },
      }),
    );
    expect(result.current.mainContent.type).toBe(ListsContainer);
  });

  it("renderiza descarga en /app", () => {
    window.history.pushState({}, "", "/app");
    const { result } = renderHook(() => useAppShellNavigation(baseArgs));
    expect(result.current.mainContent.type).toBe(MobileAppDownloadPage);
  });
});
