// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Catalog from "@src/features/catalog/Catalog";
import { ListsContainer } from "@src/features/lists";
import { AuthLoggedInNotice, AuthScreen } from "@src/features/auth";
import { MobileAppDownloadPage } from "@src/features/mobile-app";
import { useAppShellNavigation } from "@src/app-shell/useAppShellNavigation";
import { CatalogHome } from "@src/app-shell/components/CatalogHome";

const baseArgs = {
  authUser: null,
  authRedirectPending: false,
  isAuthSubmitting: false,
  authError: null,
  isCategoriesOpen: false,
  openMobileCategoriesRequestKey: 0,
  linesCount: 0,
  onLogin: vi.fn(),
  onRegister: vi.fn(),
  onOpenList: vi.fn(),
  onStartOpenList: vi.fn(),
};

describe("useAppShellNavigation", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("expone authMode en login", () => {
    window.history.pushState({}, "", "/auth/login");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.authMode).toBe("login");
    expect(result.current.mainContent.type).toBe(AuthScreen);
  });

  it("muestra aviso cuando el usuario ya está autenticado en auth", () => {
    window.history.pushState({}, "", "/auth/register");

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

    expect(result.current.authMode).toBe("register");
    expect(result.current.mainContent.type).toBe(AuthLoggedInNotice);
  });

  it("renderiza home en /", () => {
    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.mainContent.type).toBe(CatalogHome);
  });

  it("renderiza catálogo en ruta canónica provider-aware", () => {
    window.history.pushState({}, "", "/mercadona/catalog");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.mainContent.type).toBe(Catalog);
  });

  it("renderiza listas cuando hay usuario y ruta /lists", () => {
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

  it("fuerza login en /lists si no hay usuario", () => {
    window.history.pushState({}, "", "/lists");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.mainContent.type).toBe(AuthScreen);
  });

  it("renderiza la página de descarga en /app", () => {
    window.history.pushState({}, "", "/app");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.mainContent.type).toBe(MobileAppDownloadPage);
  });
});
