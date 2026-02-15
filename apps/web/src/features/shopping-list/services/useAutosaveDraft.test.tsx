// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import type { ListItem } from "@src/context/ListContextValue";
import type { AutosaveDraftInput } from "./types";
import { saveLocalDraft } from "./AutosaveService";
import { useAutosaveDraft } from "./useAutosaveDraft";

const sampleItem: ListItem = {
  id: "item-1",
  name: "Leche",
  category: "Bebidas",
  thumbnail: null,
  price: 1.5,
  quantity: 2,
};

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

type HarnessProps = {
  enabled?: boolean;
  onRehydrate?: (draft: AutosaveDraftInput) => void;
};

const Harness = ({ enabled = true, onRehydrate }: HarnessProps) => {
  const [items, setItems] = useState<ListItem[]>([]);

  useAutosaveDraft(
    {
      title: "Lista semanal",
      items,
    },
    { enabled, onRehydrate }
  );

  return (
    <button type="button" onClick={() => setItems([sampleItem])}>
      Add item
    </button>
  );
};

const TabSyncHarness = () => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [title, setTitle] = useState("Lista semanal");

  const { remoteChangesAvailable } = useAutosaveDraft(
    {
      title,
      items,
    },
    {
      enabled: false,
      onRehydrate: (draft) => {
        setTitle(draft.title);
        setItems(
          draft.items.map((item) => ({
            id: item.id,
            name: item.name,
            category: "General",
            thumbnail: item.thumbnail ?? null,
            price: item.price ?? null,
            quantity: item.qty,
          })),
        );
      },
    },
  );

  return (
    <>
      <span data-testid="title">{title}</span>
      <span data-testid="count">{items.length}</span>
      <span data-testid="remote-flag">
        {remoteChangesAvailable ? "remote" : "clean"}
      </span>
      <button type="button" onClick={() => setItems([sampleItem])}>
        Edit local
      </button>
      <button type="button" onClick={() => setTitle("Lista local") }>
        Edit title
      </button>
    </>
  );
};

describe("useAutosaveDraft", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    cleanup();
    vi.useRealTimers();
  });

  it("guarda en localStorage y hace autosave remoto con debounce", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) =>
      Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "autosave-1",
        title: "Lista semanal",
        updatedAt: "2024-01-01T00:00:00.000Z",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));

    const stored = localStorage.getItem("lists.localDraft");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored ?? "{}") as AutosaveDraftInput & {
      updatedAt?: string;
    };
    expect(parsed).toMatchObject({
      title: "Lista semanal",
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
          price: 1.5,
        },
      ],
    });
    expect(parsed.updatedAt).toEqual(expect.any(String));

    await vi.advanceTimersByTimeAsync(1500);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("rehidrata desde el borrador local al montar", () => {
    const onRehydrate = vi.fn();
    const localDraft = {
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
        },
      ],
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    localStorage.setItem("lists.localDraft", JSON.stringify(localDraft));

    render(<Harness onRehydrate={onRehydrate} />);

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
        },
      ],
    });
  });

  it("solo guarda en localStorage cuando está deshabilitado", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) =>
      Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness enabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));

    expect(localStorage.getItem("lists.localDraft")).toBeTruthy();

    await vi.advanceTimersByTimeAsync(1500);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rehidrata UI cuando llega cambio remoto y no hay cambios locales pendientes", async () => {
    render(<TabSyncHarness />);

    saveLocalDraft({
      title: "Lista remota",
      items: [
        {
          id: "item-remote",
          kind: "catalog",
          name: "Pan",
          qty: 1,
          checked: false,
          source: "mercadona",
          sourceProductId: "item-remote",
        },
      ],
    });

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "lists.localDraft",
          newValue: localStorage.getItem("lists.localDraft"),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("title")).toHaveTextContent("Lista remota");
      expect(screen.getByTestId("count")).toHaveTextContent("1");
      expect(screen.getByTestId("remote-flag")).toHaveTextContent("clean");
    });
  });

  it("no sobrescribe cambios locales pendientes y marca bandera remota", async () => {
    render(<TabSyncHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Edit local" }));

    saveLocalDraft({
      title: "Lista remota",
      items: [
        {
          id: "item-remote",
          kind: "catalog",
          name: "Pan",
          qty: 1,
          checked: false,
          source: "mercadona",
          sourceProductId: "item-remote",
        },
      ],
    });

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "lists.localDraft",
          newValue: localStorage.getItem("lists.localDraft"),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("title")).toHaveTextContent("Lista semanal");
      expect(screen.getByTestId("count")).toHaveTextContent("1");
      expect(screen.getByTestId("remote-flag")).toHaveTextContent("remote");
    });
  });
  it("no pisa un borrador previo con estado vacío al refrescar", async () => {
    const existingDraft = {
      title: "Lista previa",
      items: [
        {
          id: "item-prev",
          kind: "catalog",
          name: "Huevos",
          qty: 2,
          checked: false,
          source: "mercadona",
          sourceProductId: "item-prev",
        },
      ],
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    localStorage.setItem("lists.localDraft", JSON.stringify(existingDraft));

    render(<Harness enabled={false} />);

    await waitFor(() => {
      const stored = localStorage.getItem("lists.localDraft");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored ?? "{}");
      expect(parsed.title).toBe("Lista previa");
      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].name).toBe("Huevos");
    });
  });

  it("no hace autosave remoto cuando la pestaña no está activa", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) =>
      Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "autosave-1",
        title: "Lista semanal",
        updatedAt: "2024-01-01T00:00:00.000Z",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    render(<Harness enabled={true} />);

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    await vi.advanceTimersByTimeAsync(1500);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hace autosave remoto cuando la pestaña activa recupera foco", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) =>
      Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "autosave-1",
        title: "Lista semanal",
        updatedAt: "2024-01-01T00:00:00.000Z",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    render(<Harness enabled={true} />);

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));
    await vi.advanceTimersByTimeAsync(1500);
    expect(fetchMock).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await vi.advanceTimersByTimeAsync(1500);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({ method: "PUT" }),
    );
  });

});
