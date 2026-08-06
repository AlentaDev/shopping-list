// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Catalog } from "@src/features/catalog";
import { ListsContainer } from "@src/features/lists";
import { AuthScreen } from "@src/features/auth";
import { MobileAppDownloadPage } from "@src/features/mobile-app";
import { CatalogHome } from "@src/features/home";
import { useAppShellNavigation } from "@src/app-shell/useAppShellNavigation";

const baseArgs = {
  authUser: null,
  authRedirectPending: false,
  isAuthSubmitting: false,
  authError: null,
  linesCount: 0,
  onLogin: vi.fn(),
  onRegister: vi.fn(),
  onOpenList: vi.fn(),
  onStartOpenList: vi.fn(),
  homeDraftProviderId: null,
  showAnonymousDraftGuidance: false,
  onSelectHomeProvider: vi.fn(),
  onRequestActiveEditConflict: vi.fn(),
  onRequestDraftProviderConflict: vi.fn(),
};

describe("useAppShellNavigation (canonical path)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, "", "/");
  });

  it("resuelve /auth/* a flujo de auth", () => {
    window.history.pushState({}, "", "/auth/recover");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.authMode).toBe("login");
    expect(result.current.mainContent.type).toBe(AuthScreen);
  });

  it("renderiza home en /", () => {
    const { result } = renderHook(() => useAppShellNavigation(baseArgs));
    expect(result.current.mainContent.type).toBe(CatalogHome);
  });

  it("renderiza home en / sin requerir request de catálogo", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.mainContent.type).toBe(CatalogHome);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renderiza catálogo en /mercadona/catalog", () => {
    window.history.pushState({}, "", "/mercadona/catalog");
    const { result } = renderHook(() => useAppShellNavigation(baseArgs));
    expect(result.current.mainContent.type).toBe(Catalog);
  });

  it("inicializa categoría desde /:provider/catalog/:category", () => {
    window.history.pushState({}, "", "/mercadona/catalog/child-2");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.mainContent.type).toBe(Catalog);
    expect(result.current.mainContent.props.initialCategoryId).toBe("child-2");
    expect(result.current.mainContent.props.providerId).toBe("mercadona");
  });

  it("canonicaliza una ruta directa de catálogo de proveedor no soportado", () => {
    window.history.pushState({}, "", "/bonpreuesclat/catalog");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.currentPath).toBe("/mercadona/catalog");
    expect(window.location.pathname).toBe("/mercadona/catalog");
    expect(result.current.mainContent.type).toBe(Catalog);
    expect(result.current.mainContent.props.providerId).toBe("mercadona");
  });

  it("canonicaliza una ruta de catálogo no soportada y descarta su categoría", () => {
    window.history.pushState({}, "", "/unknown/catalog/child-2");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.currentPath).toBe("/mercadona/catalog");
    expect(window.location.pathname).toBe("/mercadona/catalog");
    expect(result.current.mainContent.props.initialCategoryId).toBeUndefined();
  });

  it("actualiza pathname con :category cuando se selecciona categoría", () => {
    window.history.pushState({}, "", "/mercadona/catalog");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    act(() => {
      result.current.mainContent.props.onCategoryRouteChange("child-2");
    });

    expect(result.current.currentPath).toBe("/mercadona/catalog/child-2");
    expect(window.location.pathname).toBe("/mercadona/catalog/child-2");
  });

  it("redirige /catalog a / cuando no hay lastProvider", () => {
    window.localStorage.removeItem("lastProvider");
    window.history.pushState({}, "", "/catalog");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.currentPath).toBe("/");
    expect(window.location.pathname).toBe("/");
    expect(result.current.mainContent.type).toBe(CatalogHome);
  });

  it("redirige /catalog a Mercadona cuando lastProvider está obsoleto", () => {
    window.localStorage.setItem("lastProvider", "bonpreuesclat");
    window.history.pushState({}, "", "/catalog");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.currentPath).toBe("/mercadona/catalog");
    expect(window.location.pathname).toBe("/mercadona/catalog");
    expect(result.current.mainContent.type).toBe(Catalog);
  });

  it("conserva la categoría para rutas Mercadona válidas", () => {
    window.history.pushState({}, "", "/mercadona/catalog");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    act(() => {
      result.current.mainContent.props.onCategoryRouteChange("merc-child");
    });

    expect(window.location.pathname).toBe("/mercadona/catalog/merc-child");
  });

  it("persiste Mercadona al canonicalizar una ruta de proveedor no soportado", () => {
    window.history.pushState({}, "", "/bonpreuesclat/catalog");

    renderHook(() => useAppShellNavigation(baseArgs));

    expect(window.localStorage.getItem("lastProvider")).toBe("mercadona");
  });

  it("canonicaliza una ruta no soportada al navegar con popstate", () => {
    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    act(() => {
      window.history.pushState({}, "", "/bonpreuesclat/catalog/child-2");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current.currentPath).toBe("/mercadona/catalog");
    expect(window.location.pathname).toBe("/mercadona/catalog");
    expect(result.current.mainContent.props.initialCategoryId).toBeUndefined();
    expect(window.localStorage.getItem("lastProvider")).toBe("mercadona");
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

  it("forwards the draft provider conflict callback to catalog and lists", () => {
    const onRequestDraftProviderConflict = vi.fn();
    const authUser = {
      id: "user-1",
      name: "Ada",
      email: "ada@example.com",
      postalCode: "28001",
    };

    window.history.pushState({}, "", "/lists");
    const listsResult = renderHook(() =>
      useAppShellNavigation({
        ...baseArgs,
        authUser,
        onRequestDraftProviderConflict,
      }),
    );

    expect(listsResult.result.current.mainContent.props.onRequestDraftProviderConflict).toBe(
      onRequestDraftProviderConflict,
    );

    window.history.pushState({}, "", "/mercadona/catalog");
    const catalogResult = renderHook(() =>
      useAppShellNavigation({
        ...baseArgs,
        onRequestDraftProviderConflict,
      }),
    );

    expect(
      catalogResult.result.current.mainContent.props.onRequestDraftProviderConflict,
    ).toBe(onRequestDraftProviderConflict);
  });

  it("renders authenticated Home without embedding lists", () => {
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

    expect(result.current.mainContent.type).toBe(CatalogHome);
  });

  it("renderiza descarga en /app", () => {
    window.history.pushState({}, "", "/app");
    const { result } = renderHook(() => useAppShellNavigation(baseArgs));
    expect(result.current.mainContent.type).toBe(MobileAppDownloadPage);
  });
});
