// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAutosaveRecovery } from "./useAutosaveRecovery";
import type { AutosaveDraftInput, LocalDraft } from "./types";

const SAMPLE_REMOTE = {
  id: "autosave-1",
  title: "Lista recuperada",
  updatedAt: "2024-01-01T10:00:00.000Z",
  items: [
    {
      id: "item-1",
      kind: "catalog",
      name: "Leche",
      qty: 2,
      checked: false,
      updatedAt: "2024-01-01T10:00:00.000Z",
      source: "mercadona",
      sourceProductId: "item-1",
    },
  ],
};

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
  status?: number;
  statusText?: string;
  text?: () => Promise<string>;
};

type HarnessProps = {
  enabled?: boolean;
  onRehydrate?: (draft: AutosaveDraftInput) => void;
  onAutoRestore?: (draft: AutosaveDraftInput) => void;
  onKeepLocalConflict?: () => void;
  onRecoverEditSession?: (listId: string) => void;
  checkEditSessionOnBootstrap?: boolean;
};

const Harness = ({
  enabled = true,
  onRehydrate,
  onAutoRestore,
  onKeepLocalConflict,
  onRecoverEditSession,
  checkEditSessionOnBootstrap = false,
}: HarnessProps) => {
  const {
    conflict,
    hasPendingConflict,
    handleUpdateFromServerFirst,
    handleKeepLocalDraft,
  } = useAutosaveRecovery({
    enabled,
    onRehydrate,
    onAutoRestore,
    onKeepLocalConflict,
    onRecoverEditSession,
    checkEditSessionOnBootstrap,
  });

  return (
    <div>
      {conflict ? (
        <div>
          <span>Conflict</span>
          <button type="button" onClick={handleUpdateFromServerFirst}>
            Update first
          </button>
          <button type="button" onClick={handleKeepLocalDraft}>
            Keep local
          </button>
        </div>
      ) : (
        <span>{hasPendingConflict ? "Pending conflict" : "No conflict"}</span>
      )}
    </div>
  );
};

describe("useAutosaveRecovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("restaura el autosave remoto si el local está vacío", async () => {
    const onRehydrate = vi.fn();
    const onAutoRestore = vi.fn();
    const localDraft: LocalDraft = {
      title: "",
      items: [],
      updatedAt: "2024-01-01T09:00:00.000Z",
    };

    localStorage.setItem("lists.localDraft", JSON.stringify(localDraft));

    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => SAMPLE_REMOTE,
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness onRehydrate={onRehydrate} onAutoRestore={onAutoRestore} />);

    await waitFor(() => {
      expect(onRehydrate).toHaveBeenCalledWith({
        title: "Lista recuperada",
        items: [
          {
            id: "item-1",
            kind: "catalog",
            name: "Leche",
            qty: 2,
            checked: false,
            source: "mercadona",
            sourceProductId: "item-1",
            thumbnail: null,
            price: null,
            unitSize: null,
            unitFormat: null,
            unitPrice: null,
            isApproxSize: false,
          },
        ],
      });
    });

    expect(onAutoRestore).toHaveBeenCalled();
    expect(sessionStorage.getItem("lists.autosaveChecked")).toBe("true");
  });

  it("sincroniza el borrador local si es más reciente", async () => {
    const localDraft: LocalDraft = {
      title: "Lista local",
      items: [
        {
          id: "item-local",
          kind: "catalog",
          name: "Pan",
          qty: 1,
          checked: false,
          source: "mercadona",
          sourceProductId: "item-local",
        },
      ],
      updatedAt: "2024-02-01T10:00:00.000Z",
    };

    localStorage.setItem("lists.localDraft", JSON.stringify(localDraft));

    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (_input, init) => {
      if (init?.method === "PUT") {
        return {
          ok: true,
          json: async () => ({ id: "autosave-1", updatedAt: "2024-02-01" }),
        };
      }

      return {
        ok: true,
        json: async () => ({
          ...SAMPLE_REMOTE,
          updatedAt: "2024-01-01T10:00:00.000Z",
        }),
      };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lists/autosave",
        expect.objectContaining({ method: "PUT" })
      );
    });

    expect(sessionStorage.getItem("lists.autosaveChecked")).toBe("true");
  });



  it("aplica flujo update first: refresca remoto, reaplica item local y sincroniza", async () => {
    const user = userEvent.setup();
    const onRehydrate = vi.fn();
    const localDraft: LocalDraft = {
      title: "Lista local",
      items: [
        {
          id: "item-local",
          kind: "catalog",
          name: "Pan",
          qty: 1,
          checked: false,
          source: "mercadona",
          sourceProductId: "item-local",
        },
      ],
      updatedAt: "2024-01-01T10:00:00.000Z",
    };

    localStorage.setItem("lists.localDraft", JSON.stringify(localDraft));

    const fetchMock = vi
      .fn<(input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>>()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...SAMPLE_REMOTE,
          updatedAt: "2024-01-01T10:00:00.000Z",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...SAMPLE_REMOTE,
          title: "Lista remota reciente",
          items: [
            {
              ...SAMPLE_REMOTE.items[0],
              id: "item-remote",
              sourceProductId: "item-remote",
            },
          ],
          updatedAt: "2024-01-01T10:00:01.000Z",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "autosave-1", updatedAt: "2024-01-01T10:00:02.000Z" }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness onRehydrate={onRehydrate} />);

    expect(await screen.findByText("Conflict")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Update first" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        "/api/lists/autosave",
        expect.objectContaining({ method: "PUT" }),
      );
    });

    const sentBody = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body ?? "{}")) as {
      items?: Array<{ id: string }>;
    };

    expect(sentBody.items?.map((item) => item.id)).toEqual([
      "item-remote",
      "item-local",
    ]);
    expect(onRehydrate).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem("lists.localDraft") ?? "").toContain("item-local");
    expect(screen.getByText("No conflict")).toBeInTheDocument();
  });

  it("keep local mantiene borrador local y marca conflicto pendiente", async () => {
    const user = userEvent.setup();
    const onKeepLocalConflict = vi.fn();
    const localDraft: LocalDraft = {
      title: "Lista local",
      items: [
        {
          id: "item-local",
          kind: "catalog",
          name: "Pan",
          qty: 1,
          checked: false,
          source: "mercadona",
          sourceProductId: "item-local",
        },
      ],
      updatedAt: "2024-01-01T10:00:00.000Z",
    };

    localStorage.setItem("lists.localDraft", JSON.stringify(localDraft));

    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          ...SAMPLE_REMOTE,
          updatedAt: "2024-01-01T10:00:00.000Z",
        }),
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness onKeepLocalConflict={onKeepLocalConflict} />);

    expect(await screen.findByText("Conflict")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keep local" }));

    await waitFor(() => {
      expect(screen.getByText("Pending conflict")).toBeInTheDocument();
    });

    const savedDraft = JSON.parse(localStorage.getItem("lists.localDraft") ?? "{}") as {
      title?: string;
      items?: Array<{ id: string }>;
      updatedAt?: string;
    };

    expect(savedDraft.title).toBe(localDraft.title);
    expect(savedDraft.items?.map((item) => item.id)).toEqual(["item-local"]);
    expect(savedDraft.updatedAt).toEqual(expect.any(String));
    expect(onKeepLocalConflict).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("muestra conflicto si empatan y difieren", async () => {
    const onRehydrate = vi.fn();
    const localDraft: LocalDraft = {
      title: "Lista local",
      items: [
        {
          id: "item-local",
          kind: "catalog",
          name: "Pan",
          qty: 1,
          checked: false,
          source: "mercadona",
          sourceProductId: "item-local",
        },
      ],
      updatedAt: "2024-01-01T10:00:00.000Z",
    };

    localStorage.setItem("lists.localDraft", JSON.stringify(localDraft));

    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          ...SAMPLE_REMOTE,
          updatedAt: "2024-01-01T10:00:00.000Z",
        }),
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness onRehydrate={onRehydrate} />);

    expect(await screen.findByText("Conflict")).toBeInTheDocument();

    expect(onRehydrate).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("lists.autosaveChecked")).not.toBe("true");
  });

  it("rehidrata borrador local + contexto de edición cuando hay sesión remota activa", async () => {
    const onRehydrate = vi.fn();
    const localDraft: LocalDraft = {
      title: "Lista local runtime",
      items: [
        {
          id: "item-local-runtime",
          kind: "catalog",
          name: "Huevos",
          qty: 2,
          checked: false,
          source: "mercadona",
          sourceProductId: "item-local-runtime",
        },
      ],
      updatedAt: "2024-02-01T10:00:00.000Z",
    };

    localStorage.setItem("lists.localDraft", JSON.stringify(localDraft));
    localStorage.setItem(
      "lists.editSession",
      JSON.stringify({
        listId: "active-list-99",
        isEditing: false,
      }),
    );

    const remoteUpdatedAt = "2024-03-01T10:00:00.000Z";
    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          ...SAMPLE_REMOTE,
          isEditing: true,
          editingTargetListId: "active-list-99",
          updatedAt: remoteUpdatedAt,
        }),
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness onRehydrate={onRehydrate} />);

    await waitFor(() => {
      expect(onRehydrate).toHaveBeenCalledWith({
        title: "Lista local runtime",
        items: [
          {
            id: "item-local-runtime",
            kind: "catalog",
            name: "Huevos",
            qty: 2,
            checked: false,
            source: "mercadona",
            sourceProductId: "item-local-runtime",
          },
        ],
      });
    });

    expect(localStorage.getItem("lists.localDraftSync")).toBe(
      JSON.stringify({ baseUpdatedAt: remoteUpdatedAt }),
    );
    expect(localStorage.getItem("lists.editSession")).toBe(
      JSON.stringify({
        listId: "active-list-99",
        isEditing: true,
      }),
    );
  });

  it("limpia marcadores locales de edición cuando no hay sesión remota activa", async () => {
    localStorage.setItem(
      "lists.editSession",
      JSON.stringify({ listId: "active-list-42", isEditing: true }),
    );

    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          ...SAMPLE_REMOTE,
          isEditing: false,
          editingTargetListId: null,
          updatedAt: "2024-04-01T10:00:00.000Z",
        }),
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness />);

    await waitFor(() => {
      expect(sessionStorage.getItem("lists.autosaveChecked")).toBe("true");
    });

    expect(localStorage.getItem("lists.editSession")).toBeNull();
  });



  it("recupera edición con autosaveChecked=true aunque no exista marcador local cuando se fuerza bootstrap", async () => {
    sessionStorage.setItem("lists.autosaveChecked", "true");
    const onRecoverEditSession = vi.fn();

    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          ...SAMPLE_REMOTE,
          isEditing: true,
          editingTargetListId: "active-list-bootstrap",
          updatedAt: "2024-06-02T10:00:00.000Z",
        }),
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <Harness
        onRecoverEditSession={onRecoverEditSession}
        checkEditSessionOnBootstrap
      />,
    );

    await waitFor(() => {
      expect(onRecoverEditSession).toHaveBeenCalledWith("active-list-bootstrap");
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("recupera sesión de edición activa aunque autosaveChecked ya esté en true", async () => {
    sessionStorage.setItem("lists.autosaveChecked", "true");
    localStorage.setItem(
      "lists.editSession",
      JSON.stringify({ listId: "active-list-checked", isEditing: true }),
    );
    const onRecoverEditSession = vi.fn();

    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          ...SAMPLE_REMOTE,
          isEditing: true,
          editingTargetListId: "active-list-checked",
          updatedAt: "2024-06-01T10:00:00.000Z",
        }),
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness onRecoverEditSession={onRecoverEditSession} />);

    await waitFor(() => {
      expect(onRecoverEditSession).toHaveBeenCalledWith("active-list-checked");
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({ method: "GET" }),
    );
  });

});
