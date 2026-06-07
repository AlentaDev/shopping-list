// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListsContainer from "./ListsContainer";
import { UI_TEXT } from "@src/shared/constants/ui";
import { LIST_STATUS } from "@src/shared/domain/listStatus";

const {
  showToastMock,
  publishListTabSyncEventMock,
  subscribeToListTabSyncEventsMock,
  draftProviderIdState,
  itemsState,
} = vi.hoisted(() => ({
  showToastMock: vi.fn(),
  publishListTabSyncEventMock: vi.fn(),
  subscribeToListTabSyncEventsMock: vi.fn(() => vi.fn()),
  draftProviderIdState: { value: "mercadona" as string },
  itemsState: { value: [] as Array<{ id: string }> },
}));

vi.mock("@src/shared/services/tab-sync/listTabSyncContract", () => ({
  createListTabSyncSourceId: () => "tab-test",
  publishListTabSyncEvent: publishListTabSyncEventMock,
  subscribeToListTabSyncEvents: subscribeToListTabSyncEventsMock,
}));

vi.mock("@src/context/useToast", () => ({
  useToast: () => ({
    showToast: showToastMock,
  }),
}));

vi.mock("@src/context/useList", () => ({
  useList: () => ({
    items: itemsState.value,
    linesCount: itemsState.value.length,
    total: 0,
    draftProviderId: draftProviderIdState.value,
    addItem: vi.fn(),
    setItems: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    setDraftProviderId: vi.fn(),
    resetDraft: vi.fn(),
  }),
}));

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("ListsContainer", () => {
  beforeEach(() => {
    draftProviderIdState.value = "mercadona";
    itemsState.value = [];
    localStorage.clear();
  });

  it("se suscribe a sincronización de activación y borrado de listas", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    const onOpenList = vi.fn();

    render(<ListsContainer onOpenList={onOpenList} />);

    expect(subscribeToListTabSyncEventsMock).toHaveBeenCalledWith({
      sourceTabId: "tab-test",
      onListActivated: expect.any(Function),
      onListDeleted: expect.any(Function),
      onListReused: expect.any(Function),
      onEditingStarted: expect.any(Function),
      onEditingFinished: expect.any(Function),
      onEditingCancelled: expect.any(Function),
    });
  });

  it("bloquea la activación de listas vacías y muestra feedback", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (input) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/lists") {
        return {
          ok: true,
          json: async () => ({
            lists: [
              {
                id: "draft-empty",
                title: "Vacía",
                updatedAt: "2024-02-01T11:00:00.000Z",
                activatedAt: null,
                itemCount: 0,
                isEditing: false,
                status: LIST_STATUS.DRAFT,
              },
            ],
          }),
        };
      }

      return {
        ok: false,
        json: async () => ({}),
      };
    });

    showToastMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);

    const onOpenList = vi.fn();

    render(<ListsContainer onOpenList={onOpenList} />);

    await userEvent.click(
      await screen.findByRole("button", { name: UI_TEXT.LISTS.ACTIONS.ACTIVATE }),
    );

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/lists/draft-empty/activate",
      expect.anything(),
    );
    expect(showToastMock).toHaveBeenCalledWith({
      message: UI_TEXT.LISTS.ACTIVATE_DISABLED_MESSAGE,
      productName: "Vacía",
    });
  });

  it("abre modal de detalle al hacer click y ejecuta acciones canónicas", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/lists") {
        return {
          ok: true,
          json: async () => ({
            lists: [
              {
                id: "active-1",
                title: "Despensa",
                updatedAt: "2024-02-01T11:00:00.000Z",
                activatedAt: "2024-02-01T10:30:00.000Z",
                itemCount: 2,
                isEditing: false,
                status: LIST_STATUS.ACTIVE,
              },
              {
                id: "completed-1",
                title: "Navidad",
                updatedAt: "2024-02-02T10:00:00.000Z",
                activatedAt: null,
                itemCount: 4,
                isEditing: false,
                status: LIST_STATUS.COMPLETED,
              },
            ],
          }),
        };
      }

      if (url === "/api/lists/active-1") {
        return {
          ok: true,
          json: async () => ({
            id: "active-1",
            title: "Despensa",
            updatedAt: "2024-02-01T11:00:00.000Z",
            activatedAt: "2024-02-01T10:30:00.000Z",
            itemCount: 2,
            isEditing: false,
            status: LIST_STATUS.ACTIVE,
            items: [
              {
                id: "item-1",
                kind: "catalog",
                name: "Leche",
                qty: 1,
                checked: true,
                updatedAt: "2024-02-01T11:30:00.000Z",
                price: 1.5,
              },
            ],
          }),
        };
      }

      if (url === "/api/lists/completed-1") {
        return {
          ok: true,
          json: async () => ({
            id: "completed-1",
            title: "Navidad",
            updatedAt: "2024-02-02T10:00:00.000Z",
            activatedAt: null,
            itemCount: 4,
            isEditing: false,
            status: LIST_STATUS.COMPLETED,
            items: [],
          }),
        };
      }

      if (url === "/api/lists/completed-1/reuse") {
        return {
          ok: true,
          json: async () => ({
            id: "duplicated-1",
            title: "Navidad",
            updatedAt: "2024-02-02T10:00:00.000Z",
            activatedAt: null,
            itemCount: 1,
            isEditing: false,
            status: LIST_STATUS.DRAFT,
            items: [
              {
                id: "duplicated-1:123",
                kind: "catalog",
                name: "Leche",
                qty: 1,
                checked: false,
                updatedAt: "2024-02-02T10:00:00.000Z",
                sourceProductId: "123",
              },
            ],
          }),
        };
      }

      if (url === "/api/lists/completed-1" && init?.method === "DELETE") {
        return {
          ok: true,
          json: async () => ({ ok: true }),
        };
      }

      return {
        ok: false,
        json: async () => ({}),
      };
    });

    vi.stubGlobal("fetch", fetchMock);

    const onOpenList = vi.fn();

    render(<ListsContainer onOpenList={onOpenList} />);

    const activeCard = await screen.findByText("Despensa");
    await userEvent.click(activeCard);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Leche")).toBeInTheDocument();
    expect(screen.getByText("Productos: 1")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.DETAIL_MODAL.CLOSE_LABEL }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.COMPLETED }),
    );

    await userEvent.click(screen.getByText("Navidad"));

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.REUSE }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lists/completed-1/reuse",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(onOpenList).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "duplicated-1",
        status: LIST_STATUS.DRAFT,
      }),
    );
    expect(publishListTabSyncEventMock).toHaveBeenCalledWith({
      type: "list-reused",
      sourceTabId: "tab-test",
    });
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/lists/completed-1/close",
      expect.anything(),
    );
  });

  it("confirms generic cross-provider reuse with explicit provider labels", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/lists") {
        return {
          ok: true,
          json: async () => ({
            lists: [
              {
                id: "completed-bonpreu",
                title: "Bonpreu reuse",
                updatedAt: "2024-02-02T10:00:00.000Z",
                activatedAt: null,
                itemCount: 2,
                isEditing: false,
                status: LIST_STATUS.COMPLETED,
                providerId: "provider-bonpreuesclat",
                provider: {
                  slug: "bonpreuesclat",
                  displayName: "Bonpreu Esclat",
                },
              },
            ],
          }),
        };
      }

      if (url === "/api/lists/completed-bonpreu") {
        return {
          ok: true,
          json: async () => ({
            id: "completed-bonpreu",
            title: "Bonpreu reuse",
            updatedAt: "2024-02-02T10:00:00.000Z",
            activatedAt: null,
            itemCount: 2,
            isEditing: false,
            status: LIST_STATUS.COMPLETED,
            providerId: "provider-bonpreuesclat",
            provider: {
              slug: "bonpreuesclat",
              displayName: "Bonpreu Esclat",
            },
            items: [],
          }),
        };
      }

      if (url === "/api/lists/completed-bonpreu/reuse" && init?.method === "POST") {
        return {
          ok: true,
          json: async () => ({
            id: "draft-bonpreu",
            title: "Bonpreu reuse",
            updatedAt: "2024-02-02T10:05:00.000Z",
            activatedAt: null,
            itemCount: 1,
            isEditing: false,
            status: LIST_STATUS.DRAFT,
            providerId: "provider-bonpreuesclat",
            provider: {
              slug: "bonpreuesclat",
              displayName: "Bonpreu Esclat",
            },
            items: [],
          }),
        };
      }

      return { ok: false, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);
    draftProviderIdState.value = "mercadona";
    itemsState.value = [{ id: "draft-item-1" }];
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const onOpenList = vi.fn();

    render(<ListsContainer onOpenList={onOpenList} hasDraftItems />);

    await userEvent.click(await screen.findByRole("tab", { name: UI_TEXT.LISTS.TABS.COMPLETED }));
    await userEvent.click(screen.getByText("Bonpreu reuse"));
    await userEvent.click(screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.REUSE }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lists/completed-bonpreu/reuse",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining("Mercadona"));
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining("Bonpreu Esclat"),
    );
    expect(onOpenList).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "draft-bonpreu",
        provider: {
          slug: "bonpreuesclat",
          displayName: "Bonpreu Esclat",
        },
      }),
    );
  });

  it("does not call /reuse when cross-provider confirm is cancelled", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (input) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/lists") {
        return {
          ok: true,
          json: async () => ({
            lists: [
              {
                id: "completed-bonpreu",
                title: "Bonpreu reuse",
                updatedAt: "2024-02-02T10:00:00.000Z",
                activatedAt: null,
                itemCount: 2,
                isEditing: false,
                status: LIST_STATUS.COMPLETED,
                providerId: "provider-bonpreuesclat",
                provider: {
                  slug: "bonpreuesclat",
                  displayName: "Bonpreu Esclat",
                },
              },
            ],
          }),
        };
      }

      return { ok: false, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);
    draftProviderIdState.value = "mercadona";
    itemsState.value = [{ id: "draft-item-1" }];
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const onOpenList = vi.fn();
    publishListTabSyncEventMock.mockClear();

    render(<ListsContainer onOpenList={onOpenList} hasDraftItems />);

    await userEvent.click(await screen.findByRole("tab", { name: UI_TEXT.LISTS.TABS.COMPLETED }));
    await userEvent.click(screen.getByText("Bonpreu reuse"));
    await userEvent.click(screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.REUSE }));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
    });

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/lists/completed-bonpreu/reuse",
      expect.anything(),
    );
    expect(onOpenList).not.toHaveBeenCalled();
    expect(publishListTabSyncEventMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "list-reused" }),
    );
  });

  it("bypasses confirm when reuse targets the same provider as the current draft", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/lists") {
        return {
          ok: true,
          json: async () => ({
            lists: [
              {
                id: "completed-mercadona",
                title: "Mercadona reuse",
                updatedAt: "2024-02-02T10:00:00.000Z",
                activatedAt: null,
                itemCount: 2,
                isEditing: false,
                status: LIST_STATUS.COMPLETED,
                providerId: "provider-mercadona",
                provider: {
                  slug: "mercadona",
                  displayName: "Mercadona",
                },
              },
            ],
          }),
        };
      }

      if (url === "/api/lists/completed-mercadona/reuse" && init?.method === "POST") {
        return {
          ok: true,
          json: async () => ({
            id: "draft-mercadona",
            title: "Mercadona reuse",
            updatedAt: "2024-02-02T10:05:00.000Z",
            activatedAt: null,
            itemCount: 1,
            isEditing: false,
            status: LIST_STATUS.DRAFT,
            providerId: "provider-mercadona",
            provider: {
              slug: "mercadona",
              displayName: "Mercadona",
            },
            items: [],
          }),
        };
      }

      return { ok: false, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);
    draftProviderIdState.value = "mercadona";
    itemsState.value = [{ id: "draft-item-1" }];
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const onOpenList = vi.fn();

    render(<ListsContainer onOpenList={onOpenList} hasDraftItems />);

    await userEvent.click(await screen.findByRole("tab", { name: UI_TEXT.LISTS.TABS.COMPLETED }));
    await userEvent.click(screen.getByText("Mercadona reuse"));
    await userEvent.click(screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.REUSE }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lists/completed-mercadona/reuse",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onOpenList).toHaveBeenCalledWith(
      expect.objectContaining({ id: "draft-mercadona" }),
    );
  });

  it("al activar una lista limpia el borrador local para sincronizar otras pestañas", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/lists") {
        return {
          ok: true,
          json: async () => ({
            lists: [
              {
                id: "draft-1",
                title: "Compra semanal",
                updatedAt: "2024-02-01T11:00:00.000Z",
                activatedAt: null,
                itemCount: 2,
                isEditing: false,
                status: LIST_STATUS.DRAFT,
              },
            ],
          }),
        };
      }

      if (url === "/api/lists/draft-1/activate" && init?.method === "PATCH") {
        return {
          ok: true,
          json: async () => ({
            id: "draft-1",
            status: LIST_STATUS.ACTIVE,
          }),
        };
      }

      return {
        ok: false,
        json: async () => ({}),
      };
    });

    vi.stubGlobal("fetch", fetchMock);

    localStorage.setItem(
      "lists.localDraft",
      JSON.stringify({
        title: "Compra semanal",
        items: [{ id: "item-1", kind: "catalog", name: "Leche", qty: 2 }],
      }),
    );

    render(<ListsContainer onOpenList={vi.fn()} />);

    await userEvent.click(
      await screen.findByRole("button", { name: UI_TEXT.LISTS.ACTIONS.ACTIVATE }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lists/draft-1/activate",
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    const storedDraft = localStorage.getItem("lists.localDraft");
    expect(storedDraft).toBeTruthy();

    expect(JSON.parse(storedDraft ?? "{}")).toMatchObject({
      title: "",
      items: [],
    });
  });



  it("refresca listas cuando otra pestaña inicia edición", async () => {
    let emitEditingStarted: (() => void) | null = null;
    subscribeToListTabSyncEventsMock.mockImplementation(({ onEditingStarted }) => {
      emitEditingStarted = onEditingStarted;
      return vi.fn();
    });

    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (input) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/lists") {
        return {
          ok: true,
          json: async () => ({
            lists: [
              {
                id: "active-remote-edit",
                title: "Activa",
                updatedAt: "2024-02-01T11:00:00.000Z",
                activatedAt: "2024-02-01T10:30:00.000Z",
                itemCount: 2,
                isEditing: false,
                status: LIST_STATUS.ACTIVE,
              },
            ],
          }),
        };
      }

      return { ok: false, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ListsContainer onOpenList={vi.fn()} />);

    await screen.findByText("Activa");

    act(() => {
      emitEditingStarted?.();
    });

    await waitFor(() => {
      const listFetchCalls = fetchMock.mock.calls.filter(
        ([input]) => (typeof input === "string" ? input : input.url) === "/api/lists",
      );

      expect(listFetchCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("refresca listas al recibir sincronización de borrador vacío desde otra pestaña", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (input) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/lists") {
        return {
          ok: true,
          json: async () => ({
            lists: [
              {
                id: "draft-remote",
                title: "Pendiente",
                updatedAt: "2024-02-01T11:00:00.000Z",
                activatedAt: null,
                itemCount: 1,
                isEditing: false,
                status: LIST_STATUS.DRAFT,
              },
            ],
          }),
        };
      }

      return {
        ok: false,
        json: async () => ({}),
      };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ListsContainer onOpenList={vi.fn()} />);

    await screen.findByText("Pendiente");

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "lists.localDraft",
          newValue: JSON.stringify({ title: "", items: [] }),
        }),
      );
    });

    await waitFor(() => {
      const listFetchCalls = fetchMock.mock.calls.filter(
        ([input]) => (typeof input === "string" ? input : input.url) === "/api/lists",
      );

      expect(listFetchCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("publica sincronización al borrar una lista desde acciones", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/lists") {
        return {
          ok: true,
          json: async () => ({
            lists: [
              {
                id: "completed-1",
                title: "Navidad",
                updatedAt: "2024-02-02T10:00:00.000Z",
                activatedAt: null,
                itemCount: 4,
                isEditing: false,
                status: LIST_STATUS.COMPLETED,
              },
            ],
          }),
        };
      }

      if (url === "/api/lists/completed-1" && init?.method === "DELETE") {
        return {
          ok: true,
          json: async () => ({ ok: true }),
        };
      }

      return { ok: false, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);
    publishListTabSyncEventMock.mockClear();

    render(<ListsContainer onOpenList={vi.fn()} />);

    await userEvent.click(await screen.findByRole("tab", { name: UI_TEXT.LISTS.TABS.COMPLETED }));
    await userEvent.click(screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.DELETE }));
    await userEvent.click(screen.getByRole("button", { name: UI_TEXT.LISTS.DELETE_CONFIRMATION.CONFIRM_LABEL }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lists/completed-1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    expect(publishListTabSyncEventMock).toHaveBeenCalledWith({
      type: "list-deleted",
      sourceTabId: "tab-test",
    });
  });

  it("en editar lista activa ejecuta start-edit antes de abrir el modal", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/lists") {
        return {
          ok: true,
          json: async () => ({
            lists: [
              {
                id: "active-edit-1",
                title: "Despensa",
                updatedAt: "2024-02-01T11:00:00.000Z",
                activatedAt: "2024-02-01T10:30:00.000Z",
                itemCount: 2,
                isEditing: false,
                status: LIST_STATUS.ACTIVE,
              },
            ],
          }),
        };
      }

      if (url === "/api/lists/active-edit-1") {
        return {
          ok: true,
          json: async () => ({
            id: "active-edit-1",
            title: "Despensa",
            updatedAt: "2024-02-01T11:00:00.000Z",
            activatedAt: "2024-02-01T10:30:00.000Z",
            itemCount: 2,
            isEditing: true,
            status: LIST_STATUS.ACTIVE,
            items: [],
          }),
        };
      }

      if (url === "/api/lists/active-edit-1/editing" && init?.method === "PATCH") {
        return {
          ok: true,
          json: async () => ({ ok: true }),
        };
      }

      return { ok: false, json: async () => ({}) };
    });

    vi.stubGlobal("fetch", fetchMock);

    const onOpenList = vi.fn();
    const onStartOpenList = vi.fn();

    render(
      <ListsContainer onOpenList={onOpenList} onStartOpenList={onStartOpenList} />,
    );

    await userEvent.click(await screen.findByText("Despensa"));
    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.EDIT }),
    );

    await waitFor(() => {
      expect(onOpenList).toHaveBeenCalledTimes(1);
    });

    const calls = fetchMock.mock.calls.map(([input]) =>
      typeof input === "string" ? input : input.url,
    );

    expect(calls.indexOf("/api/lists/active-edit-1/editing")).toBeLessThan(
      calls.lastIndexOf("/api/lists/active-edit-1"),
    );

    expect(onStartOpenList).toHaveBeenCalledWith(
      expect.objectContaining({ id: "active-edit-1" }),
    );
    expect(publishListTabSyncEventMock).toHaveBeenCalledWith({
      type: "editing-started",
      sourceTabId: "tab-test",
    });
    expect(onOpenList).toHaveBeenCalledWith(
      expect.objectContaining({ id: "active-edit-1", isEditing: true }),
    );
  });

  it("muestra toast de error cuando falla start-edit", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;

      if (url === "/api/lists") {
        return {
          ok: true,
          json: async () => ({
            lists: [
              {
                id: "active-edit-error",
                title: "Despensa",
                updatedAt: "2024-02-01T11:00:00.000Z",
                activatedAt: "2024-02-01T10:30:00.000Z",
                itemCount: 2,
                isEditing: false,
                status: LIST_STATUS.ACTIVE,
              },
            ],
          }),
        };
      }

      if (url === "/api/lists/active-edit-error") {
        return {
          ok: true,
          json: async () => ({
            id: "active-edit-error",
            title: "Despensa",
            updatedAt: "2024-02-01T11:00:00.000Z",
            activatedAt: "2024-02-01T10:30:00.000Z",
            itemCount: 2,
            isEditing: false,
            status: LIST_STATUS.ACTIVE,
            items: [],
          }),
        };
      }

      if (url === "/api/lists/active-edit-error/editing" && init?.method === "PATCH") {
        return {
          ok: false,
          json: async () => ({ ok: false }),
        };
      }

      return { ok: false, json: async () => ({}) };
    });

    showToastMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);

    const onOpenList = vi.fn();

    render(<ListsContainer onOpenList={onOpenList} />);

    await userEvent.click(await screen.findByText("Despensa"));
    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.EDIT }),
    );

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith({
        message: "Unable to start list editing.",
        productName: "Despensa",
      });
    });

    expect(onOpenList).not.toHaveBeenCalled();
  });


});
