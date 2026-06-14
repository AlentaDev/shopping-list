// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@src/app-shell/AppShell";
import type { ListDetail } from "@src/features/lists";

type ShoppingListMockProps = {
  isOpen: boolean;
  initialIsEditing?: boolean;
  onClose: () => void;
};

const shoppingListSpy = vi.fn();
const navigateMock = vi.fn();
const cancelListEditingMock = vi.fn(async () => undefined);
const deleteAutosaveMock = vi.fn(async () => undefined);
const loadLocalDraftMock = vi.fn(() => null);
const saveLocalDraftMock = vi.fn();

const adapterMocks = vi.hoisted(() => ({
  adaptListToShoppingListStateMock: vi.fn((list) => ({
    listId: list.id,
    listTitle: list.title,
    listStatus: "ACTIVE",
    isEditing: list.isEditing,
    items: list.items,
  })),
  adaptListStatusToShoppingListStatusMock: vi.fn(() => "ACTIVE"),
}));

vi.mock("@src/features/shopping-list", () => ({
  adaptListToShoppingListState: adapterMocks.adaptListToShoppingListStateMock,
  adaptListStatusToShoppingListStatus:
    adapterMocks.adaptListStatusToShoppingListStatusMock,
  loadLocalDraft: () => loadLocalDraftMock(),
  saveLocalDraft: (...args: unknown[]) => saveLocalDraftMock(...args),
  deleteAutosave: () => deleteAutosaveMock(),
  cancelListEditing: (listId: string) => cancelListEditingMock(listId),
  ShoppingList: (props: ShoppingListMockProps) => {
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

vi.mock("@src/shared/components/toast/Toast", () => ({
  default: () => <div data-testid="toast-placeholder" />,
}));

vi.mock("@src/context/useToast", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock("@src/context/ApiAwakeContext", () => ({
  useApiAwake: () => ({ apiAwake: true }),
}));

vi.mock("@src/context/useList", () => ({
  useList: () => ({
    linesCount: 0,
    setItems: vi.fn(),
    resetDraft: vi.fn(),
    setDraftProviderId: vi.fn(),
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
  useAppShellNavigation: ({
    onOpenList,
    onRequestActiveEditConflict,
  }: {
    onOpenList: (list: ListDetail) => void;
    onRequestActiveEditConflict: (input: {
      currentProviderId: string;
      requestedProviderId: string;
    }) => void;
  }) => ({
    authMode: null,
    currentPath: "/",
    navigate: navigateMock,
    mainContent: (
      <>
        <button
          type="button"
          onClick={() =>
            onOpenList({
              id: "active-list-1",
              title: "Lista activa",
              status: "ACTIVE",
              isEditing: true,
              provider: {
                slug: "mercadona",
                displayName: "Mercadona",
              },
              items: [
                {
                  id: "item-1",
                  kind: "catalog",
                  name: "Pan",
                  qty: 2,
                  checked: false,
                  updatedAt: "2024-02-01T10:00:00.000Z",
                },
              ],
            })
          }
        >
          open-editing-list
        </button>
        <button
          type="button"
          onClick={() =>
            onRequestActiveEditConflict({
              currentProviderId: "mercadona",
              requestedProviderId: "bonpreuesclat",
            })
          }
        >
          trigger-active-edit-conflict
        </button>
      </>
    ),
  }),
}));

vi.mock("@src/app-shell/components/AppHeader", () => ({
  AppHeader: ({ onOpenCart }: { onOpenCart: () => void }) => (
    <button type="button" onClick={onOpenCart}>
      open-cart
    </button>
  ),
}));

describe("AppShell editing session persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
    cancelListEditingMock.mockClear();
    deleteAutosaveMock.mockClear();
    loadLocalDraftMock.mockReset();
    loadLocalDraftMock.mockReturnValue(null);
    saveLocalDraftMock.mockReset();
    window.history.pushState({}, "", "/");
    localStorage.clear();
    adapterMocks.adaptListToShoppingListStateMock.mockReset();
    adapterMocks.adaptListStatusToShoppingListStatusMock.mockReset();
    adapterMocks.adaptListToShoppingListStateMock.mockImplementation((list) => ({
      listId: list.id,
      listTitle: list.title,
      listStatus: "ACTIVE",
      isEditing: list.isEditing,
      items: list.items,
    }));
    adapterMocks.adaptListStatusToShoppingListStatusMock.mockImplementation(
      () => "ACTIVE",
    );
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

  it("delegates list payload transformation to shopping-list adapters", async () => {
    const user = userEvent.setup();

    render(<AppShell />);

    await user.click(screen.getByRole("button", { name: "open-editing-list" }));

    expect(adapterMocks.adaptListToShoppingListStateMock).toHaveBeenCalledWith({
      id: "active-list-1",
      title: "Lista activa",
      status: "ACTIVE",
      isEditing: true,
      provider: {
        slug: "mercadona",
        displayName: "Mercadona",
      },
      items: [
        {
          id: "item-1",
          kind: "catalog",
          name: "Pan",
          qty: 2,
          checked: false,
          updatedAt: "2024-02-01T10:00:00.000Z",
        },
      ],
    });
  });

  it("offers only active-edit conflict actions for cross-provider mutations", async () => {
    const user = userEvent.setup();

    render(<AppShell />);

    await user.click(
      screen.getByRole("button", { name: "trigger-active-edit-conflict" }),
    );

    expect(
      screen.getByText("Ya estás editando otra lista"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mercadona/)).toBeInTheDocument();
    expect(screen.getByText(/Bonpreu Esclat/)).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    const buttons = within(dialog).getAllByRole("button");

    expect(buttons).toHaveLength(2);
    expect(dialog).toHaveTextContent("Volver al catálogo original");
    expect(dialog).toHaveTextContent("Cancelar edición y empezar una lista nueva");
  });

  it("cancels editing and redirects to the requested provider when the user confirms", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "lists.editSession",
      JSON.stringify({ listId: "active-list-1", isEditing: true }),
    );

    render(<AppShell />);

    await user.click(
      screen.getByRole("button", { name: "trigger-active-edit-conflict" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Cancelar edición y empezar una lista nueva",
      }),
    );

    await waitFor(() => {
      expect(cancelListEditingMock).toHaveBeenCalledWith("active-list-1");
    });
    expect(deleteAutosaveMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/bonpreuesclat/catalog");
  });
});
