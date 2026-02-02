// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShoppingList from "./ShoppingList";
import { ListProvider } from "@src/context/ListContext";
import type { ListItem } from "@src/context/ListContextValue";
import { AuthContext, type AuthContextType } from "@src/context/AuthContext";

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
  }: {
    items?: ListItem[];
    authenticated?: boolean;
    listId?: string | null;
    listStatus?: "LOCAL_DRAFT" | "DRAFT" | "ACTIVE" | "COMPLETED";
    listTitle?: string;
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
            onClose={vi.fn()}
            initialListId={listId}
            initialListStatus={listStatus}
            initialListTitle={listTitle}
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
    >(async () => ({
      ok: true,
      json: async () => ({}),
    }));

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

  it("updates total when incrementing quantity", async () => {
    renderShoppingList();

    await userEvent.click(
      screen.getByRole("button", {
        name: `Incrementar cantidad de ${appleName}`,
      }),
    );

    expect(screen.getByTestId(totalTestId)).toHaveTextContent(/5,80\s?€/);
  });

  it("shows the save step and allows canceling", async () => {
    renderShoppingList();

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar lista" }),
    );

    expect(
      screen.getByRole("textbox", { name: "Nombre de la lista" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("shows the list name in the modal title after saving", async () => {
    renderShoppingList();

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar lista" }),
    );

    await userEvent.type(
      screen.getByRole("textbox", { name: "Nombre de la lista" }),
      "Compra semanal",
    );

    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      screen.getByRole("heading", { level: 2, name: "Compra semanal" }),
    ).toBeInTheDocument();
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
});
