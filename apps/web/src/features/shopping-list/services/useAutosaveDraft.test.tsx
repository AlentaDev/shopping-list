// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import type { ListItem } from "@src/context/ListContextValue";
import {
  DEFAULT_DRAFT_PROVIDER_ID,
  type AutosaveDraftInput,
} from "./types";
import { saveLocalDraft } from "./AutosaveService";
import { useAutosaveDraft } from "./useAutosaveDraft";

const sampleItem: ListItem = {
  id: "item-1",
  sourceProductId: "4706",
  name: "Leche",
  category: "Bebidas",
  categorySnapshot: "Lácteos",
  subcategorySnapshot: "Leche entera",
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
  title?: string;
};

const Harness = ({
  enabled = true,
  onRehydrate,
  title = "Lista semanal",
}: HarnessProps) => {
  const [items, setItems] = useState<ListItem[]>([]);

  useAutosaveDraft(
    {
      title,
      items,
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
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
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
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


const DirtySourceProductHarness = () => {
  const [items, setItems] = useState<ListItem[]>([]);

  useAutosaveDraft(
    {
      title: "Lista semanal",
      items,
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
    },
    { enabled: true },
  );

  return (
    <button
      type="button"
      onClick={() =>
        setItems([
          {
            id: "active-1:4706",
            sourceProductId: "active-1:4706:4706",
            name: "Leche",
            category: "Bebidas",
            thumbnail: null,
            price: 1.5,
            quantity: 2,
          },
        ])
      }
    >
      Add dirty item
    </button>
  );
};

const LegacyCategoryOnlyHarness = () => {
  const [items, setItems] = useState<ListItem[]>([]);

  useAutosaveDraft(
    {
      title: "Lista semanal",
      items,
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
    },
    { enabled: true },
  );

  return (
    <button
      type="button"
      onClick={() =>
        setItems([
          {
            id: "legacy-1",
            sourceProductId: "legacy-1",
            name: "Pan",
            category: "Panadería",
            thumbnail: null,
            price: 1.2,
            quantity: 1,
          },
        ])
      }
    >
      Add legacy item
    </button>
  );
};

const MixedIdentityHarness = () => {
  const [items, setItems] = useState<ListItem[]>([]);

  useAutosaveDraft(
    {
      title: "Lista semanal",
      items,
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
    },
    { enabled: true },
  );

  return (
    <button
      type="button"
      onClick={() =>
        setItems([
          {
            id: "4706",
            sourceProductId: "4706",
            name: "Leche",
            category: "Bebidas",
            thumbnail: null,
            price: 1.5,
            quantity: 1,
          },
          {
            id: "active-1:4706",
            sourceProductId: "active-1:4706:4706",
            name: "Leche",
            category: "Bebidas",
            thumbnail: null,
            price: 1.5,
            quantity: 3,
          },
        ])
      }
    >
      Add mixed identity items
    </button>
  );
};

const SecondaryTabHarness = ({ enabled = true }: { enabled?: boolean }) => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [title, setTitle] = useState("Lista secundaria");

  const { remoteChangesAvailable } = useAutosaveDraft(
    {
      title,
      items,
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
    },
    {
      enabled,
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
      <span data-testid="secondary-title">{title}</span>
      <span data-testid="secondary-count">{items.length}</span>
      <span data-testid="secondary-remote-flag">
        {remoteChangesAvailable ? "remote" : "clean"}
      </span>
      <button type="button" onClick={() => setItems([sampleItem])}>
        Secondary edit local
      </button>
    </>
  );
};

const ReuseAfterRehydrateHarness = () => {
  const [title, setTitle] = useState("Lista inicial");
  const [items, setItems] = useState<ListItem[]>([]);

  useAutosaveDraft(
    {
      title,
      items,
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
    },
    {
      enabled: false,
      onRehydrate: () => {
        setTitle("Lista reutilizada");
        setItems([
          {
            id: "item-reused-1",
            sourceProductId: "8901",
            name: "Yogur",
            category: "Lácteos",
            thumbnail: null,
            price: 2.2,
            quantity: 3,
          },
        ]);
      },
    },
  );

  return <span data-testid="reuse-state">ready</span>;
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
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
      items: [
        {
          id: "item-1",
          kind: "catalog",
          name: "Leche",
          qty: 2,
          checked: false,
          source: "mercadona",
          sourceProductId: "4706",
          categorySnapshot: "Lácteos",
          subcategorySnapshot: "Leche entera",
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

  it("usa category legacy como fallback de categorySnapshot en payload autosave", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) =>
      Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "autosave-legacy",
        title: "Lista semanal",
        updatedAt: "2024-01-01T00:00:00.000Z",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    render(<LegacyCategoryOnlyHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Add legacy item" }));
    await vi.advanceTimersByTimeAsync(1500);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({ method: "PUT" }),
    );

    const autosaveCall = fetchMock.mock.calls.find(
      ([input, init]) => input === "/api/lists/autosave" && init?.method === "PUT",
    );

    expect(autosaveCall).toBeTruthy();

    const payload = JSON.parse(String(autosaveCall?.[1]?.body)) as {
      items: Array<{
        categorySnapshot: string | null;
        subcategorySnapshot: string | null;
      }>;
    };

    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).toMatchObject({
      categorySnapshot: "Panadería",
      subcategorySnapshot: null,
    });
  });

  it("rehidrata desde el borrador local al montar", () => {
    const onRehydrate = vi.fn();
    const localDraft = {
      title: "Lista recuperada",
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
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


  it("normaliza sourceProductId antes de enviar autosave remoto", async () => {
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

    render(<DirtySourceProductHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Add dirty item" }));

    await vi.advanceTimersByTimeAsync(1500);

    const putCall = fetchMock.mock.calls.find((call) => call[1]?.method === "PUT");
    const body = putCall?.[1]?.body;

    expect(typeof body).toBe("string");
    expect(body).toContain('"sourceProductId":"4706"');
  });

  it("serializa un solo item canónico cuando entran ids legacy mezclados", async () => {
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

    render(<MixedIdentityHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Add mixed identity items" }));

    await vi.advanceTimersByTimeAsync(1500);

    const putCall = fetchMock.mock.calls.find((call) => call[1]?.method === "PUT");
    const body = JSON.parse(String(putCall?.[1]?.body)) as {
      items: Array<{ id: string; sourceProductId: string; qty: number; checked: boolean }>;
    };

    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      id: "active-1:4706",
      sourceProductId: "4706",
      qty: 3,
      checked: false,
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
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
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

  it("aplica cambios remotos incluso si hubo una edición local previa", async () => {
    render(<TabSyncHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Edit local" }));

    saveLocalDraft({
      title: "Lista remota",
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
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

  it("pestaña secundaria autenticada recibe actualizaciones desde lists.localDraft", async () => {
    render(<SecondaryTabHarness enabled={false} />);

    saveLocalDraft({
      title: "Lista remota autenticada",
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
      items: [
        {
          id: "item-remote-auth",
          kind: "catalog",
          name: "Arroz",
          qty: 3,
          checked: false,
          source: "mercadona",
          sourceProductId: "item-remote-auth",
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
      expect(screen.getByTestId("secondary-title")).toHaveTextContent(
        "Lista remota autenticada",
      );
      expect(screen.getByTestId("secondary-count")).toHaveTextContent("1");
      expect(screen.getByTestId("secondary-remote-flag")).toHaveTextContent(
        "clean",
      );
    });
  });

  it("pestaña secundaria inactiva no ejecuta autosave remoto aunque esté autenticada", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) =>
      Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "autosave-1",
        title: "Lista secundaria",
        updatedAt: "2024-01-01T00:00:00.000Z",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    render(<Harness enabled={true} title="Lista secundaria" />);

    fireEvent.click(screen.getByRole("button", { name: "Add item" }));

    await vi.advanceTimersByTimeAsync(1500);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sincroniza la pestaña secundaria cuando llega un cambio remoto más reciente", async () => {
    render(<SecondaryTabHarness enabled={false} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Secondary edit local" }),
    );

    saveLocalDraft({
      title: "Lista remota externa",
      providerId: DEFAULT_DRAFT_PROVIDER_ID,
      items: [
        {
          id: "item-remote-2",
          kind: "catalog",
          name: "Pasta",
          qty: 1,
          checked: false,
          source: "mercadona",
          sourceProductId: "item-remote-2",
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
      expect(screen.getByTestId("secondary-title")).toHaveTextContent(
        "Lista remota externa",
      );
      expect(screen.getByTestId("secondary-count")).toHaveTextContent("1");
      expect(screen.getByTestId("secondary-remote-flag")).toHaveTextContent(
        "clean",
      );
    });
  });

  it("persiste en localStorage el draft reutilizado cuando ya existía draft previo al montar", async () => {
    localStorage.setItem(
      "lists.localDraft",
      JSON.stringify({
        title: "Lista previa",
        providerId: DEFAULT_DRAFT_PROVIDER_ID,
        items: [
          {
            id: "item-previo",
            kind: "catalog",
            name: "Huevos",
            qty: 1,
            checked: false,
            source: "mercadona",
            sourceProductId: "item-previo",
          },
        ],
        updatedAt: "2024-01-01T00:00:00.000Z",
      }),
    );

    render(<ReuseAfterRehydrateHarness />);

    await waitFor(() => {
      const stored = localStorage.getItem("lists.localDraft");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored ?? "{}") as {
        title: string;
        items: Array<{ name: string; sourceProductId: string; qty: number }>;
      };

      expect(parsed.title).toBe("Lista reutilizada");
      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0]).toMatchObject({
        name: "Yogur",
        sourceProductId: "8901",
        qty: 3,
      });
    });
  });

});
