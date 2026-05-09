// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./AppShell";

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
  useAppShellNavigation: () => ({
    authMode: "login",
    currentPath: "/auth/login",
    navigate: vi.fn(),
    mainContent: <div>auth-login-screen</div>,
  }),
}));

vi.mock("@src/features/shopping-list/ShoppingList", () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="shopping-list-open">{String(isOpen)}</div>
  ),
}));

vi.mock("@src/app-shell/components/AppHeader", () => ({
  AppHeader: ({ onOpenCart }: { onOpenCart: () => void }) => (
    <button type="button" onClick={onOpenCart}>
      open-cart
    </button>
  ),
}));

describe("app-shell/AppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/auth/login");
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
});
