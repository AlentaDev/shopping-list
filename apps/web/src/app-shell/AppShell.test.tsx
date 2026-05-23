// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./AppShell";

const useAppShellNavigationMock = vi.fn(() => ({
  authMode: "login",
  currentPath: "/auth/login",
  navigate: vi.fn(),
  mainContent: <div>auth-login-screen</div>,
}));

const showToastMock = vi.fn();
const authState = { authUser: null as { id: string } | null };
const apiAwakeState = { apiAwake: true };

vi.mock("@src/shared/components/toast/Toast", () => ({
  default: () => <div data-testid="toast-placeholder" />,
}));

vi.mock("@src/context/useToast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

vi.mock("@src/context/useList", () => ({
  useList: () => ({
    linesCount: 3,
    setItems: vi.fn(),
  }),
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

vi.mock("@src/features/shopping-list/ShoppingList", () => ({
  default: ({
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
}));

vi.mock("@src/app-shell/components/AppHeader", () => ({
  AppHeader: ({
    onOpenCart,
    onToggleCategories,
  }: {
    onOpenCart: () => void;
    onToggleCategories: () => void;
  }) => (
    <>
      <button type="button" onClick={onOpenCart}>
        open-cart
      </button>
      <button type="button" onClick={onToggleCategories}>
        toggle-categories
      </button>
    </>
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
  });

  it("renderiza contenido auth canónico", () => {
    render(<AppShell />);

    expect(screen.getByText("auth-login-screen")).toBeInTheDocument();
    expect(screen.getByTestId("shopping-list-open")).toHaveTextContent("false");
    expect(screen.queryByText("Tu lista ya está lista para continuar.")).not.toBeInTheDocument();
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

  it("en desktop mantiene toggle de categorías como antes", async () => {
    const user = userEvent.setup();
    render(<AppShell />);

    await user.click(screen.getByRole("button", { name: "toggle-categories" }));
    await user.click(screen.getByRole("button", { name: "toggle-categories" }));

    const lastCallArgs = useAppShellNavigationMock.mock.calls.at(-1)?.[0] as {
      isCategoriesOpen: boolean;
    };
    expect(lastCallArgs.isCategoriesOpen).toBe(false);
  });

  it("en mobile fuerza categorías abiertas y dispara solicitud de overlay", async () => {
    const user = userEvent.setup();
    setMatchMedia({ "(max-width: 767px)": true });
    render(<AppShell />);

    await user.click(screen.getByRole("button", { name: "toggle-categories" }));

    const lastCallArgs = useAppShellNavigationMock.mock.calls.at(-1)?.[0] as {
      isCategoriesOpen: boolean;
      openMobileCategoriesRequestKey: number;
    };

    expect(lastCallArgs.isCategoriesOpen).toBe(true);
    expect(lastCallArgs.openMobileCategoriesRequestKey).toBe(1);
  });

  it("en mobile landscape mantiene comportamiento de overlay", async () => {
    const user = userEvent.setup();
    setMatchMedia({
      "(max-width: 767px)": false,
      "(pointer: coarse)": true,
      "(orientation: landscape)": true,
      "(max-height: 500px)": true,
    });
    render(<AppShell />);

    await user.click(screen.getByRole("button", { name: "toggle-categories" }));

    const lastCallArgs = useAppShellNavigationMock.mock.calls.at(-1)?.[0] as {
      isCategoriesOpen: boolean;
      openMobileCategoriesRequestKey: number;
    };

    expect(lastCallArgs.isCategoriesOpen).toBe(true);
    expect(lastCallArgs.openMobileCategoriesRequestKey).toBe(1);
  });

  it("en desktop con pointer fine conserva toggle clásico", async () => {
    const user = userEvent.setup();
    setMatchMedia({
      "(max-width: 767px)": false,
      "(pointer: coarse)": false,
      "(orientation: landscape)": true,
      "(max-height: 500px)": true,
    });
    render(<AppShell />);

    await user.click(screen.getByRole("button", { name: "toggle-categories" }));
    await user.click(screen.getByRole("button", { name: "toggle-categories" }));

    const lastCallArgs = useAppShellNavigationMock.mock.calls.at(-1)?.[0] as {
      isCategoriesOpen: boolean;
      openMobileCategoriesRequestKey: number;
    };

    expect(lastCallArgs.isCategoriesOpen).toBe(false);
    expect(lastCallArgs.openMobileCategoriesRequestKey).toBe(0);
  });

  it("navega a /catalog al añadir más productos desde la lista", async () => {
    const user = userEvent.setup();
    const navigateMock = vi.fn();
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
});
