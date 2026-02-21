// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShoppingList from "./ShoppingList";
import { ListProvider } from "@src/context/ListContext";
import type { ListItem } from "@src/context/ListContextValue";
import { AuthContext, type AuthContextType } from "@src/context/AuthContext";
import { ToastProvider } from "@src/context/ToastContext";
import { UI_TEXT } from "@src/shared/constants/ui";
import Toast from "@src/shared/components/toast/Toast";

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
    sessionStorage.setItem("lists.autosaveChecked", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn<
        (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
      >(async () => ({
        ok: true,
        json: async () => null,
      })),
    );
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
    isLoading,
    onClose = vi.fn(),
    onAddMoreProducts = vi.fn(),
  }: {
    items?: ListItem[];
    authenticated?: boolean;
    listId?: string | null;
    listStatus?: "LOCAL_DRAFT" | "DRAFT" | "ACTIVE" | "COMPLETED";
    listTitle?: string;
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
        <ToastProvider>
          <ListProvider initialItems={items}>
            <ShoppingList
              isOpen
              onClose={onClose}
              onAddMoreProducts={onAddMoreProducts}
              initialListId={listId}
              initialListStatus={listStatus}
              initialListTitle={listTitle}
              isLoading={isLoading}
            />
            <Toast />
          </ListProvider>
        </ToastProvider>
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

    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(screen.getByTestId(totalTestId)).toHaveTextContent(/2,70\s?€/);
    expect(screen.getAllByTestId("shopping-list-item")).toHaveLength(2);
    expect(
      screen.getByText(UI_TEXT.SHOPPING_LIST.TOAST_REMOVED_MESSAGE),
    ).toBeInTheDocument();
    expect(screen.getByText(milkName)).toBeInTheDocument();
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

    expect(screen.queryByText("¿Eliminar producto de la lista?")).toBeNull();
    expect(screen.getByText(appleName)).toBeInTheDocument();
  });

  it("confirma el borrado remoto cuando hay listId", async () => {
    const fetchMock = vi.fn<
      (
        input: RequestInfo,
        init?: RequestInit,
      ) => Promise<{
        ok: boolean;
        json: () => Promise<unknown>;
      }>
    >(() => new Promise<FetchResponse>(() => {}));

    vi.stubGlobal("fetch", fetchMock);

    renderShoppingList({ listId: "list-99", listStatus: "ACTIVE" });

    await userEvent.click(
      screen.getByRole("button", { name: `Eliminar ${appleName}` }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-99/items/item-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("permite editar el título en listas draft", async () => {
    renderShoppingList({
      authenticated: true,
      listStatus: "DRAFT",
      listTitle: "Mi lista inicial",
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Editar título" }),
    );

    const input = screen.getByRole("textbox", { name: "Título de la lista" });
    await userEvent.clear(input);
    await userEvent.type(input, "Lista renombrada");
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar título" }),
    );

    expect(
      screen.getByRole("heading", { name: "Lista renombrada" }),
    ).toBeInTheDocument();
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
        name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.DELETE,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.EDIT,
      }),
    ).toBeNull();
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
      screen.getByRole("button", {
        name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.DELETE,
      }),
    ).toBeInTheDocument();
  });

  it("reusa la lista y adapta los items del payload", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<
      (
        input: RequestInfo,
        init?: RequestInit,
      ) => Promise<{
        ok: boolean;
        json: () => Promise<unknown>;
      }>
    >(async (input) => {
      if (typeof input === "string" && input.endsWith("/reuse")) {
        return {
          ok: true,
          json: async () => ({
            id: "reuse-1",
            title: "Lista reusada",
            items: [
              {
                id: "item-9",
                name: "Café",
                qty: 3,
                price: 2.5,
              },
            ],
          }),
        };
      }

      return { ok: true, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);

    renderShoppingList({
      authenticated: true,
      listId: "list-9",
      listStatus: "COMPLETED",
      items: [],
    });

    await user.click(
      screen.getByRole("button", {
        name: UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.REUSE,
      }),
    );

    expect(await screen.findByText("Café")).toBeInTheDocument();
    expect(screen.getByTestId("quantity-item-9")).toHaveTextContent("3");
    expect(
      screen.getByRole("heading", { name: "Lista reusada" }),
    ).toBeInTheDocument();
  });

  it("confirma el borrado de la lista desde el detalle", async () => {
    const fetchMock = vi.fn<
      (
        input: RequestInfo,
        init?: RequestInit,
      ) => Promise<{
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

  it("cierra el modal y navega al catálogo al finalizar lista", async () => {
    const onClose = vi.fn();
    const onAddMoreProducts = vi.fn();
    const fetchMock = vi.fn<
      (
        input: RequestInfo,
        init?: RequestInit,
      ) => Promise<{
        ok: boolean;
        json: () => Promise<unknown>;
      }>
    >(async (input, init) => {
      if (typeof input === "string" && input.endsWith("/activate")) {
        return {
          ok: true,
          json: async () => ({ id: "list-100", status: "ACTIVE" }),
        };
      }

      if (init?.method === "PUT") {
        return { ok: true, json: async () => ({}) };
      }

      return { ok: true, json: async () => null };
    });

    vi.stubGlobal("fetch", fetchMock);

    renderShoppingList({
      authenticated: true,
      listId: "list-100",
      listStatus: "DRAFT",
      onClose,
      onAddMoreProducts,
    });

    await userEvent.click(
      screen.getByRole("button", {
        name: UI_TEXT.LIST_MODAL.READY_TO_SHOP_LABEL,
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-100/activate",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(
      screen.getByText(UI_TEXT.LIST_MODAL.READY_TO_SHOP_TOAST_MESSAGE),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE).length,
    ).toBeGreaterThan(0);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAddMoreProducts).toHaveBeenCalledTimes(1);

    expect(
      screen.getByText(UI_TEXT.SHOPPING_LIST.EMPTY_LIST_TITLE),
    ).toBeInTheDocument();

    const storedLocalDraft = localStorage.getItem("lists.localDraft");
    expect(storedLocalDraft).not.toBeNull();
    expect(JSON.parse(storedLocalDraft ?? "{}")).toEqual(
      expect.objectContaining({ items: [] }),
    );
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


  it("sincroniza reseteo de borrador cuando otra pestaña activa una lista", async () => {
    const originalBroadcastChannel = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = undefined as never;

    renderShoppingList({
      authenticated: true,
      listId: "list-remote",
      listStatus: "DRAFT",
      items: [initialItems[0]],
      listTitle: "Borrador remoto",
    });

    expect(screen.getByText(initialItems[0].name)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "lists.tabSync",
          newValue: JSON.stringify({
            type: "list-activated",
            sourceTabId: "other-tab",
            timestamp: Date.now(),
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(UI_TEXT.SHOPPING_LIST.EMPTY_LIST_TITLE),
      ).toBeInTheDocument();
    });

    globalThis.BroadcastChannel = originalBroadcastChannel;
  });

  it("restaura el autosave remoto y muestra un toast si el local está vacío", async () => {
    sessionStorage.setItem("lists.autosaveChecked", "false");
    const fetchMock = vi.fn<
      (
        input: RequestInfo,
        init?: RequestInit,
      ) => Promise<{
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
                name: "Leche",
                qty: 2,
                checked: false,
                updatedAt: "2024-01-01T00:00:00.000Z",
                source: "mercadona",
                sourceProductId: "item-1",
              },
            ],
          }),
        };
      });

    vi.stubGlobal("fetch", fetchMock);
    localStorage.setItem(
      "lists.localDraft",
      JSON.stringify({
        title: "",
        items: [],
        updatedAt: "2024-01-01T00:00:00.000Z",
      })
    );

    renderShoppingList({ items: [], authenticated: true });

    expect(await screen.findByText("Leche")).toBeInTheDocument();
    expect(await screen.findByTestId("quantity-item-1")).toHaveTextContent("2");
    expect(
      await screen.findByText(
        UI_TEXT.SHOPPING_LIST.AUTOSAVE_RECOVERY.RESTORED_TOAST_MESSAGE
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Lista recuperada" })
    ).toBeInTheDocument();
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

  it("deshabilita la acción de activar lista si no hay items", () => {
    renderShoppingList({
      authenticated: true,
      listStatus: "LOCAL_DRAFT",
      items: [],
    });

    const readyToShopButton = screen.getByRole("button", {
      name: UI_TEXT.LIST_MODAL.READY_TO_SHOP_LABEL,
    });

    expect(readyToShopButton).toBeDisabled();
    expect(
      screen.getByText(UI_TEXT.LIST_MODAL.READY_TO_SHOP_EMPTY_MESSAGE),
    ).toBeInTheDocument();
  });
});
