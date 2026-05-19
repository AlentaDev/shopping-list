// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./AppShell";

const useAppShellNavigationMock = vi.fn(() => ({
  authMode: "login",
  currentPath: "/auth/login",
  navigate: vi.fn(),
  mainContent: <div>auth-login-screen</div>,
}));

vi.mock("@src/shared/components/toast/Toast", () => ({
  default: () => <div data-testid="toast-placeholder" />,
}));

vi.mock("@src/context/useList", () => ({
  useList: () => ({
    linesCount: 3,
    setItems: vi.fn(),
  }),
}));

vi.mock("@src/context/useAuth", () => ({
  useAuth: () => ({
    authUser: null,
    isAuthSubmitting: false,
    authError: null,
    isUserMenuOpen: false,
    setIsUserMenuOpen: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@src/app-shell/useAppShellNavigation", () => ({
  useAppShellNavigation: (args: unknown) => useAppShellNavigationMock(args),
}));

vi.mock("@src/features/shopping-list/ShoppingList", () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="shopping-list-open">{String(isOpen)}</div>
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
});
