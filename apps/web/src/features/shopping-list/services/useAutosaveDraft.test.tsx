// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import type { ListItem } from "@src/context/ListContextValue";
import type { AutosaveDraftInput } from "./types";
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

describe("useAutosaveDraft", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
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
});
