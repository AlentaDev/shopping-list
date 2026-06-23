// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./AppShell";

let navigationState = {
  authMode: "login" as "login" | "register" | null,
  currentPath: "/auth/login",
  navigate: vi.fn(),
  mainContent: <div>auth-login-screen</div>,
};

const useAppShellNavigationMock = vi.fn(() => navigationState);

const showToastMock = vi.fn();
const authState = { authUser: null as { id: string } | null };
const apiAwakeState = { apiAwake: true };
const saveLocalDraftMock = vi.fn();
const loadLocalDraftMock = vi.fn(() => null);
const listState = {
  linesCount: 3,
  draftProviderId: "mercadona",
  setItems: vi.fn(),
  resetDraft: vi.fn(),
  setDraftProviderId: vi.fn(),
};

vi.mock("@src/shared/components/toast/Toast", () => ({
  default: () => <div data-testid="toast-placeholder" />,
}));

vi.mock("@src/context/useToast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("@src/context/useList", () => ({
  useList: () => listState,
}));

vi.mock("@src/context/useAuth", () => ({
  useAuth: () => ({
    authUser: authState.authUser,
    isAuthSubmitting: false,
    authError: null,
    isUserMenuOpen: false,
    setIsUserMenuOpen: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@src/context/ApiAwakeContext", () => ({
  useApiAwake: () => ({ apiAwake: apiAwakeState.apiAwake }),
}));

const fetchWithAuthMock = vi.fn();

vi.mock("@src/infrastructure/http/fetchWithAuthRuntime", () => ({
  fetchWithAuth: (url: string) => fetchWithAuthMock(url),
}));

vi.mock("@src/app-shell/useAppShellNavigation", () => ({
  useAppShellNavigation: (args: unknown) => useAppShellNavigationMock(args),
}));

vi.mock("@src/features/shopping-list", () => ({
  ShoppingList: ({
    isOpen,
    mutationsEnabled,
    onAddMoreProducts,
  }: {
    isOpen: boolean;
    mutationsEnabled?: boolean;
    onAddMoreProducts?: () => void;
  }) => (
    <div>
      <div data-testid="shopping-list-open">{String(isOpen)}</div>
      <div data-testid="shopping-list-mutations">{String(Boolean(mutationsEnabled))}</div>
      <button type="button" onClick={onAddMoreProducts}>
        add-more-products
      </button>
    </div>
  ),
  adaptListToShoppingListState: vi.fn(),
  adaptListStatusToShoppingListStatus: vi.fn(),
  loadLocalDraft: () => loadLocalDraftMock(),
  saveLocalDraft: (...args: unknown[]) => saveLocalDraftMock(...args),
  deleteAutosave: vi.fn(),
  cancelListEditing: vi.fn(),
}));

vi.mock("@src/app-shell/components/AppHeader", () => ({
  AppHeader: ({
    onOpenCart,
    currentPath,
    isCatalogRoute,
    catalogProviderId,
  }: {
    onOpenCart: () => void;
    currentPath: string;
    isCatalogRoute: boolean;
    catalogProviderId: string | null;
  }) => (
    <>
      <div data-testid="header-current-path">{currentPath}</div>
      <div data-testid="header-is-catalog-route">{String(isCatalogRoute)}</div>
      <div data-testid="header-catalog-provider-id">{catalogProviderId ?? ""}</div>
      <button type="button" onClick={onOpenCart}>
        open-cart
      </button>
    </>
  ),
}));

vi.mock("@src/app-shell/components/AppFooter", () => ({
  AppFooter: ({
    contentLayout = "default",
  }: {
    contentLayout?: "default" | "catalog";
  }) => (
    <div
      data-testid="app-footer-content"
      data-content-layout={contentLayout}
    />
  ),
}));

describe("app-shell/AppShell", () => {
  const setMatchMedia = (queries: Record<string, boolean>) => {
    vi.mocked(window.matchMedia).mockImplementation(
      (query: string) => ({
        matches: queries[query] ?? false,
      }) as MediaQueryList,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authState.authUser = null;
    apiAwakeState.apiAwake = true;
    window.history.pushState({}, "", "/auth/login");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    navigationState = {
      authMode: "login",
      currentPath: "/auth/login",
      navigate: vi.fn(),
      mainContent: <div>auth-login-screen</div>,
    };
    useAppShellNavigationMock.mockImplementation(() => navigationState);
    window.localStorage.clear();
    loadLocalDraftMock.mockReset();
    loadLocalDraftMock.mockReturnValue(null);
    saveLocalDraftMock.mockReset();
    listState.linesCount = 3;
    listState.draftProviderId = "mercadona";
    listState.setItems.mockReset();
    listState.resetDraft.mockReset();
    listState.setDraftProviderId.mockReset();
  });

  it("persists the selected provider for an anonymous empty draft from Home", async () => {
    listState.linesCount = 0;
    render(<AppShell />);

    const lastCallArgs = useAppShellNavigationMock.mock.calls.at(-1)?.[0] as {
      homeDraftProviderId: string | null;
      onSelectHomeProvider: (providerId: string) => void;
    };

    await act(async () => {
      lastCallArgs.onSelectHomeProvider("bonpreuesclat");
    });

    expect(listState.resetDraft).toHaveBeenCalledWith("bonpreuesclat");
    expect(navigationState.navigate).toHaveBeenCalledWith("/bonpreuesclat/catalog");
    expect(saveLocalDraftMock).toHaveBeenCalledWith({
      title: "",
      providerId: "bonpreuesclat",
      items: [],
    });
  });

  it("passes anonymous draft guidance context only when a local draft exists", () => {
    loadLocalDraftMock.mockReturnValue({
      title: "",
      providerId: "bonpreuesclat",
      items: [],
      updatedAt: "2026-06-06T15:00:00.000Z",
    });

    render(<AppShell />);

    const lastCallArgs = useAppShellNavigationMock.mock.calls.at(-1)?.[0] as {
      homeDraftProviderId: string | null;
      showAnonymousDraftGuidance: boolean;
    };

    expect(lastCallArgs.homeDraftProviderId).toBe("bonpreuesclat");
    expect(lastCallArgs.showAnonymousDraftGuidance).toBe(true);
  });

  it("renderiza contenido auth canónico", () => {
    render(<AppShell />);

    expect(screen.getByText("auth-login-screen")).toBeInTheDocument();
    expect(screen.getByTestId("shopping-list-open")).toHaveTextContent("false");
    expect(screen.getByTestId("app-footer-content")).toBeInTheDocument();
    expect(screen.queryByText("Tu lista ya está lista para continuar.")).not.toBeInTheDocument();
  });

  it("shows landing footer and landing header variant on home", () => {
    navigationState = {
      authMode: null,
      currentPath: "/",
      navigate: vi.fn(),
      mainContent: <div>home-screen</div>,
    };
    useAppShellNavigationMock.mockImplementation(() => navigationState);

    render(<AppShell />);

    expect(screen.getByTestId("app-footer-content")).toBeInTheDocument();
    expect(screen.getByTestId("app-footer-content")).toHaveAttribute(
      "data-content-layout",
      "default",
    );
  });

  it("renders the catalog footer as a global footer aligned to the products column", () => {
    navigationState = {
      authMode: null,
      currentPath: "/mercadona/catalog",
      navigate: vi.fn(),
      mainContent: <div>catalog-screen</div>,
    };
    useAppShellNavigationMock.mockImplementation(() => navigationState);

    render(<AppShell />);

    expect(screen.getByTestId("header-current-path")).toHaveTextContent("/mercadona/catalog");
    expect(screen.getByTestId("header-is-catalog-route")).toHaveTextContent("true");
    expect(screen.getByTestId("header-catalog-provider-id")).toHaveTextContent("mercadona");
    const footer = screen.getByTestId("app-footer-content");
    const main = screen.getByRole("main");

    expect(footer).toBeInTheDocument();
    expect(footer).toHaveAttribute("data-content-layout", "catalog");
    expect(main).not.toContainElement(footer);
    expect(main).toHaveClass("flex-1");
  });

  it("renders non-catalog pages with the default global content footer", () => {
    navigationState = {
      authMode: null,
      currentPath: "/lists",
      navigate: vi.fn(),
      mainContent: <div>lists-screen</div>,
    };
    useAppShellNavigationMock.mockImplementation(() => navigationState);

    render(<AppShell />);

    const footer = screen.getByTestId("app-footer-content");
    const main = screen.getByRole("main");

    expect(footer).toHaveAttribute("data-content-layout", "default");
    expect(main).not.toContainElement(footer);
  });

  it("mantiene banner WAITING y bloquea mutaciones hasta handshake READY", async () => {
    authState.authUser = { id: "user-1" };
    apiAwakeState.apiAwake = false;
    fetchWithAuthMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lists: [{ provider: { slug: "mercadona" } }] }),
    });

    const { rerender } = render(<AppShell />);

    expect(screen.getByText("Estamos preparando tu lista para que puedas seguir comprando.")).toBeInTheDocument();
    expect(screen.getByTestId("shopping-list-mutations")).toHaveTextContent("false");

    apiAwakeState.apiAwake = true;
    rerender(<AppShell />);

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Tu lista ya está lista para continuar." }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("shopping-list-mutations")).toHaveTextContent("true");
    });

    expect(screen.queryByText("Estamos preparando tu lista para que puedas seguir comprando.")).not.toBeInTheDocument();
  });

  it("no hace polling infinito de drafts cuando falla la lista", async () => {
    authState.authUser = { id: "user-1" };

    render(<AppShell />);

    await waitFor(() => {
      expect(screen.getByTestId("shopping-list-mutations")).toHaveTextContent("true");
    });

    expect(fetchWithAuthMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Estamos preparando tu lista para que puedas seguir comprando.")).not.toBeInTheDocument();
  });

  it("sale de WAITING a READY cuando health responde ok", async () => {
    authState.authUser = { id: "user-1" };
    apiAwakeState.apiAwake = false;

    const { rerender } = render(<AppShell />);

    expect(screen.getByText("Estamos preparando tu lista para que puedas seguir comprando.")).toBeInTheDocument();

    apiAwakeState.apiAwake = true;
    rerender(<AppShell />);

    await waitFor(() => {
      expect(screen.queryByText("Estamos preparando tu lista para que puedas seguir comprando.")).not.toBeInTheDocument();
    });

    expect(showToastMock).toHaveBeenCalledTimes(1);
  });

  it("si health ok y drafts falla, no deja banner de waking clavado", async () => {
    authState.authUser = { id: "user-1" };

    render(<AppShell />);

    await waitFor(() => {
      expect(screen.queryByText("Estamos preparando tu lista para que puedas seguir comprando.")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("shopping-list-mutations")).toHaveTextContent("true");
    expect(fetchWithAuthMock).not.toHaveBeenCalled();
  });

  it("abre carrito desde la cabecera canónica", async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole("button", { name: "open-cart" }));

    expect(screen.getByTestId("shopping-list-open")).toHaveTextContent("true");
  });

  it("passes non-catalog routes to the header as inactive catalog state", () => {
    navigationState = {
      authMode: null,
      currentPath: "/app",
      navigate: vi.fn(),
      mainContent: <div>download-screen</div>,
    };
    useAppShellNavigationMock.mockImplementation(() => navigationState);

    render(<AppShell />);

    expect(screen.getByTestId("header-current-path")).toHaveTextContent("/app");
    expect(screen.getByTestId("header-is-catalog-route")).toHaveTextContent("false");
    expect(screen.getByTestId("header-catalog-provider-id")).toHaveTextContent("");
    expect(screen.getByTestId("app-footer-content")).toBeInTheDocument();
    expect(screen.queryByTestId("catalog-content-footer-layout")).not.toBeInTheDocument();
  });

  it("navigates to the current draft provider catalog when adding more products", async () => {
    const user = userEvent.setup();
    const navigateMock = vi.fn();
    listState.draftProviderId = "bonpreuesclat";

    useAppShellNavigationMock.mockImplementation(() => ({
      authMode: null,
      currentPath: "/lists",
      navigate: navigateMock,
      mainContent: <div>lists-screen</div>,
    }));

    render(<AppShell />);

    await user.click(screen.getByRole("button", { name: "add-more-products" }));

    expect(navigateMock).toHaveBeenCalledWith("/bonpreuesclat/catalog");
  });

  it("falls back to the catalog alias when the draft provider is missing", async () => {
    const user = userEvent.setup();
    const navigateMock = vi.fn();
    listState.draftProviderId = "";

    useAppShellNavigationMock.mockImplementation(() => ({
      authMode: null,
      currentPath: "/lists",
      navigate: navigateMock,
      mainContent: <div>lists-screen</div>,
    }));

    render(<AppShell />);

    await user.click(screen.getByRole("button", { name: "add-more-products" }));

    expect(navigateMock).toHaveBeenCalledWith("/catalog");
  });

  it("does not remount the page container on route changes", () => {
    const { rerender } = render(<AppShell />);
    const firstContainer = screen.getByTestId("page-transition");

    navigationState = {
      authMode: null,
      currentPath: "/mercadona/catalog/child-2",
      navigate: navigationState.navigate,
      mainContent: <div>catalog-screen</div>,
    };
    rerender(<AppShell />);

    expect(screen.getByTestId("page-transition")).toBe(firstContainer);
    expect(screen.getByText("catalog-screen")).toBeInTheDocument();
  });
});
