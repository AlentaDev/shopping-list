// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { Children, Fragment } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import Catalog from "@src/features/catalog/Catalog";
import { ListsContainer } from "@src/features/lists";
import { AuthScreen } from "@src/features/auth";
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
  homeDraftProviderId: null,
  showAnonymousDraftGuidance: false,
  onSelectHomeProvider: vi.fn(),
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

  it("redirige /catalog al lastProvider guardado", () => {
    window.localStorage.setItem("lastProvider", "carrefour");
    window.history.pushState({}, "", "/catalog");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    expect(result.current.currentPath).toBe("/carrefour/catalog");
    expect(window.location.pathname).toBe("/carrefour/catalog");
    expect(result.current.mainContent.type).toBe(Catalog);
  });

  it("respeta semántica de URL aislada al cambiar provider", () => {
    window.history.pushState({}, "", "/mercadona/catalog");

    const { result } = renderHook(() => useAppShellNavigation(baseArgs));

    act(() => {
      result.current.mainContent.props.onCategoryRouteChange("merc-child");
    });
    expect(window.location.pathname).toBe("/mercadona/catalog/merc-child");

    act(() => {
      result.current.navigate("/carrefour/catalog");
    });

    act(() => {
      result.current.mainContent.props.onCategoryRouteChange("car-child");
    });

    expect(window.location.pathname).toBe("/carrefour/catalog/car-child");
  });

  it("persiste lastProvider al resolver una ruta canónica de catálogo", () => {
    window.history.pushState({}, "", "/bonpreuesclat/catalog");

    renderHook(() => useAppShellNavigation(baseArgs));

    expect(window.localStorage.getItem("lastProvider")).toBe("bonpreuesclat");
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

  it("composes authenticated Home with provider entry and mixed-provider lists", () => {
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

    expect(result.current.mainContent.type).toBe(Fragment);

    const children = Children.toArray(result.current.mainContent.props.children);

    expect(children).toHaveLength(2);
    expect(children[0]).toMatchObject({ type: CatalogHome });
    expect(children[1]).toMatchObject({ type: ListsContainer });
  });

  it("renderiza descarga en /app", () => {
    window.history.pushState({}, "", "/app");
    const { result } = renderHook(() => useAppShellNavigation(baseArgs));
    expect(result.current.mainContent.type).toBe(MobileAppDownloadPage);
  });
});
