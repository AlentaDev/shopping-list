// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./AppShell";
import type { ListDetail } from "@src/features/lists/services/types";

type ShoppingListMockProps = {
  isOpen: boolean;
  initialIsEditing?: boolean;
  onClose: () => void;
};

const shoppingListSpy = vi.fn();

vi.mock("@src/shared/components/toast/Toast", () => ({
  default: () => <div data-testid="toast-placeholder" />,
}));

vi.mock("@src/context/useList", () => ({
  useList: () => ({
    linesCount: 0,
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

vi.mock("@src/features/app-shell/useAppShellNavigation", () => ({
  useAppShellNavigation: ({ onOpenList }: { onOpenList: (list: ListDetail) => void }) => ({
    authMode: null,
    currentPath: "/",
    navigate: vi.fn(),
    mainContent: (
      <button
        type="button"
        onClick={() =>
          onOpenList({
            id: "active-list-1",
            title: "Lista activa",
            status: "ACTIVE",
            isEditing: true,
            items: [],
          })
        }
      >
        open-editing-list
      </button>
    ),
  }),
}));

vi.mock("@src/features/app-shell/components/AppHeader", () => ({
  AppHeader: ({ onOpenCart }: { onOpenCart: () => void }) => (
    <button type="button" onClick={onOpenCart}>
      open-cart
    </button>
  ),
}));

vi.mock("@src/features/shopping-list/ShoppingList", () => ({
  default: (props: ShoppingListMockProps) => {
    shoppingListSpy(props);

    return (
      <div>
        <span data-testid="shopping-list-open">{String(props.isOpen)}</span>
        <span data-testid="shopping-list-editing">
          {String(props.initialIsEditing)}
        </span>
        <button type="button" onClick={props.onClose}>
          close-shopping-list
        </button>
      </div>
    );
  },
}));

describe("AppShell editing session persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/");
  });

  it("mantiene initialIsEditing=true tras cerrar y reabrir modal durante edición activa", async () => {
    const user = userEvent.setup();

    render(<AppShell />);

    await user.click(screen.getByRole("button", { name: "open-editing-list" }));

    expect(screen.getByTestId("shopping-list-open")).toHaveTextContent("true");
    expect(screen.getByTestId("shopping-list-editing")).toHaveTextContent(
      "true",
    );

    await user.click(
      screen.getByRole("button", { name: "close-shopping-list" }),
    );

    expect(screen.getByTestId("shopping-list-open")).toHaveTextContent("false");
    expect(screen.getByTestId("shopping-list-editing")).toHaveTextContent(
      "true",
    );

    await user.click(screen.getByRole("button", { name: "open-cart" }));

    expect(screen.getByTestId("shopping-list-open")).toHaveTextContent("true");
    expect(screen.getByTestId("shopping-list-editing")).toHaveTextContent(
      "true",
    );
  });
});
