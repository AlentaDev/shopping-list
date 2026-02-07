// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShoppingList from "./ShoppingList";
import { ListProvider } from "@src/context/ListContext";
import type { ListItem } from "@src/context/ListContextValue";
import { AuthContext, type AuthContextType } from "@src/context/AuthContext";
import { UI_TEXT } from "@src/shared/constants/ui";

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("ShoppingList", () => {
  const totalTestId = "total-value";
  const appleName = "Manzanas Fuji";
  const milkName = "Leche entera";
  const breadName = "Pan integral multicereal extra largo";
  const authUser = {
    id: "user-1",
    name: "María",
    email: "maria@example.com",
    postalCode: "28001",
  };
  const initialItems: ListItem[] = [
    {
      id: "item-1",
      name: appleName,
      category: "Frutas",
      thumbnail:
        "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=120&q=80",
      price: 1.2,
      quantity: 1,
    },
    {
      id: "item-2",
      name: milkName,
      category: "Bebidas",
      thumbnail: null,
      price: 0.95,
      quantity: 2,
    },
    {
      id: "item-3",
      name: breadName,
      category: "Panadería",
      thumbnail:
        "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=120&q=80",
      price: 1.5,
      quantity: 1,
    },
  ];

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const baseAuthContext: AuthContextType = {
    authUser: null,
    isAuthSubmitting: false,
    authError: null,
    isUserMenuOpen: false,
    setIsUserMenuOpen: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  };

  const renderShoppingList = ({
    items = initialItems,
    authenticated = false,
    listId,
    listStatus,
    listTitle,
    listIsEditing,
    isLoading,
    onClose = vi.fn(),
    onAddMoreProducts = vi.fn(),
  }: {
    items?: ListItem[];
    authenticated?: boolean;
    listId?: string | null;
    listStatus?: "LOCAL_DRAFT" | "DRAFT" | "ACTIVE" | "COMPLETED";
    listTitle?: string;
    listIsEditing?: boolean;
    isLoading?: boolean;
    onClose?: () => void;
    onAddMoreProducts?: () => void;
  } = {}) =>
    render(
      <AuthContext.Provider
        value={{
          ...baseAuthContext,
          authUser: authenticated ? authUser : null,
        }}
      >
        <ListProvider initialItems={items}>
          <ShoppingList
            isOpen
            onClose={onClose}
            onAddMoreProducts={onAddMoreProducts}
            initialListId={listId}
            initialListStatus={listStatus}
            initialListTitle={listTitle}
            initialListIsEditing={listIsEditing}
            isLoading={isLoading}
          />
        </ListProvider>
      </AuthContext.Provider>,
    );

  it("sorts items by category", () => {
    renderShoppingList();

    const itemNames = screen
      .getAllByTestId("item-name")
      .map((item) => item.textContent);

    expect(itemNames).toEqual([
      "Leche entera",
      "Manzanas Fuji",
      "Pan integral multicereal extra largo",
    ]);
  });

  it("never decrements below 1", async () => {
    renderShoppingList();

    const decrementButton = screen.getByRole("button", {
      name: `Disminuir cantidad de ${appleName}`,
    });

    expect(decrementButton).toBeDisabled();

    await userEvent.click(decrementButton);

    expect(screen.getByTestId("quantity-item-1")).toHaveTextContent("1");
  });

  it("removes a line item and updates total", async () => {
    renderShoppingList();

    expect(screen.getByTestId(totalTestId)).toHaveTextContent(/4,60\s?€/);

    await userEvent.click(
      screen.getByRole("button", { name: `Eliminar ${milkName}` }),
    );

    expect(
      screen.getByText("¿Eliminar producto de la lista?"),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Sí, eliminar" }),
    );

    expect(screen.getByTestId(totalTestId)).toHaveTextContent(/2,70\s?€/);
    expect(screen.queryByText(milkName)).toBeNull();
  });

  it("permite cancelar el borrado desde la confirmación", async () => {
    renderShoppingList();

    await userEvent.click(
      screen.getByRole("button", { name: `Eliminar ${appleName}` }),
    );

    expect(
      screen.getByText("¿Eliminar producto de la lista?"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(
      screen.queryByText("¿Eliminar producto de la lista?"),
    ).toBeNull();
    expect(screen.getByText(appleName)).toBeInTheDocument();
  });

  it("confirma el borrado remoto cuando hay listId", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<{
        ok: boolean;
        json: () => Promise<unknown>;
      }>
    >(() => new Promise<FetchResponse>(() => {}));

    vi.stubGlobal("fetch", fetchMock);

    renderShoppingList({ listId: "list-99", listStatus: "ACTIVE" });

    await userEvent.click(
      screen.getByRole("button", { name: `Eliminar ${appleName}` }),
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Sí, eliminar" }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-99/items/item-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("muestra acciones de detalle para listas activas", () => {
    sessionStorage.setItem("lists.autosaveChecked", "true");

    renderShoppingList({
      authenticated: true,
      listId: "list-1",
      listStatus: "ACTIVE",
    });

    expect(
      screen.getByRole("button", {
        name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.EDIT,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.CLOSE,
      }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("button", {
        name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.DELETE,
      }),
    ).toBeInTheDocument();
  });

  it("muestra acciones de detalle para listas completadas", () => {
    sessionStorage.setItem("lists.autosaveChecked", "true");

    renderShoppingList({
      authenticated: true,
      listId: "list-2",
      listStatus: "COMPLETED",
    });

    expect(
      screen.getByRole("button", {
        name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.REUSE,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.CLOSE,
      }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("button", {
        name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.DELETE,
      }),
    ).toBeInTheDocument();
  });

  it("confirma el borrado de la lista desde el detalle", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<{
        ok: boolean;
        json: () => Promise<unknown>;
      }>
    >(async (input, init) => {
      if (typeof input === "string" && input.endsWith("/reuse")) {
        return {
          ok: true,
          json: async () => ({ id: "reuse-1", title: "Reuso", items: [] }),
        };
      }

      if (init?.method === "DELETE") {
        return { ok: true, json: async () => ({}) };
      }

      return { ok: true, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);
    const onClose = vi.fn();

    renderShoppingList({
      authenticated: true,
      listId: "list-3",
      listStatus: "ACTIVE",
      listTitle: "Mi lista",
      onClose,
    });

    await userEvent.click(
      screen.getByRole("button", {
        name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.DELETE,
      }),
    );

    expect(
      screen.getByText(UI_TEXT.SHOPPING_LIST.DELETE_LIST_CONFIRMATION.TITLE),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", {
        name: UI_TEXT.SHOPPING_LIST.DELETE_LIST_CONFIRMATION.CONFIRM_LABEL,
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-3",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("muestra placeholders cuando el detalle está cargando", () => {
    renderShoppingList({ isLoading: true });

    expect(screen.getByTestId("shopping-list-skeleton")).toBeInTheDocument();
  });

  it("deshabilita acciones mientras se edita", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<{
        ok: boolean;
        json: () => Promise<unknown>;
      }>
    >(() => new Promise<FetchResponse>(() => {}));

    vi.stubGlobal("fetch", fetchMock);

    renderShoppingList({
      authenticated: true,
      listId: "list-20",
      listStatus: "ACTIVE",
    });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", {
          name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.EDIT,
        }),
      );
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-20/editing",
      expect.objectContaining({ method: "PATCH" }),
    );

    expect(
      await screen.findByRole("button", {
        name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS_LOADING.EDIT,
      }),
    ).toBeDisabled();
  });

  it("bloquea la edición en móvil cuando la lista activa está en edición", async () => {
    const originalMatchMedia = window.matchMedia;

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("max-width"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    sessionStorage.setItem("lists.autosaveChecked", "true");

    await act(async () => {
      renderShoppingList({
        authenticated: true,
        listId: "list-10",
        listStatus: "ACTIVE",
        listIsEditing: true,
      });
    });

    expect(
      screen.getByRole("button", {
        name: `Incrementar cantidad de ${appleName}`,
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: `Eliminar ${appleName}` }),
    ).toBeDisabled();

    window.matchMedia = originalMatchMedia;
  });

  it("updates total when incrementing quantity", async () => {
    renderShoppingList();

    await userEvent.click(
      screen.getByRole("button", {
        name: `Incrementar cantidad de ${appleName}`,
      }),
    );

    expect(screen.getByTestId(totalTestId)).toHaveTextContent(/5,80\s?€/);
  });

  it("closes and notifies when adding more products", async () => {
    const onClose = vi.fn();
    const onAddMoreProducts = vi.fn();

    renderShoppingList({ onClose, onAddMoreProducts });

    await userEvent.click(
      screen.getByRole("button", { name: "Añadir más productos" }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAddMoreProducts).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state message when there are no items", () => {
    renderShoppingList({ items: [] });

    expect(
      screen.getByText("Tu lista está en modo zen 🧘‍♂️"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Añade algo del catálogo y empezamos a llenar la cesta.",
      ),
    ).toBeInTheDocument();
  });

  it("muestra el banner de recuperación y permite continuar", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<{
        ok: boolean;
        json: () => Promise<unknown>;
      }>
    >(async (_input, init) => {
      if (init?.method === "DELETE") {
        return { ok: true, json: async () => ({}) };
      }

      return {
        ok: true,
        json: async () => ({
          id: "autosave-1",
          title: "Lista recuperada",
          updatedAt: "2024-01-01T00:00:00.000Z",
          items: [
            {
              id: "item-1",
              kind: "manual",
              name: "Leche",
              qty: 2,
              checked: false,
              note: null,
              updatedAt: "2024-01-01T00:00:00.000Z",
            },
          ],
        }),
      };
    });

    vi.stubGlobal("fetch", fetchMock);

    renderShoppingList({ items: [], authenticated: true });

    expect(
      await screen.findByText("Hemos encontrado un borrador guardado"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Leche")).toBeInTheDocument();
    expect(
      screen.queryByText("Hemos encontrado un borrador guardado"),
    ).toBeNull();
  });

  it("descarta el autosave remoto desde el banner", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<{
        ok: boolean;
        json: () => Promise<unknown>;
      }>
    >(async (_input, init) => {
      if (init?.method === "DELETE") {
        return { ok: true, json: async () => ({}) };
      }

      return {
        ok: true,
        json: async () => ({
          id: "autosave-1",
          title: "Lista recuperada",
          updatedAt: "2024-01-01T00:00:00.000Z",
          items: [],
        }),
      };
    });

    vi.stubGlobal("fetch", fetchMock);

    renderShoppingList({ items: [], authenticated: true });

    await screen.findByText("Hemos encontrado un borrador guardado");

    await user.click(screen.getByRole("button", { name: "Descartar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(
      screen.queryByText("Hemos encontrado un borrador guardado"),
    ).toBeNull();
  });

  it("no intenta guardar autosave remoto si el usuario no está autenticado", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderShoppingList({ authenticated: false });

    await vi.advanceTimersByTimeAsync(2000);

    expect(fetchMock).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("oculta la acción de activar lista si no hay sesión", () => {
    renderShoppingList({ authenticated: false, listStatus: "LOCAL_DRAFT" });

    expect(
      screen.queryByRole("button", {
        name: UI_TEXT.LIST_MODAL.READY_TO_SHOP_LABEL,
      }),
    ).toBeNull();
  });
});
