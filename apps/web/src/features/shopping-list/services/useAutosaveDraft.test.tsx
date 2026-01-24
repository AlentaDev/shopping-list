// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import type { ListItem } from "@src/context/ListContextValue";
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
};

const Harness = ({ enabled = true }: HarnessProps) => {
  const [items, setItems] = useState<ListItem[]>([]);

  useAutosaveDraft(
    {
      title: "Lista semanal",
      items,
    },
    { enabled }
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
    expect(JSON.parse(stored ?? "{}")).toEqual({
      title: "Lista semanal",
      items: [
        {
          id: "item-1",
          kind: "manual",
          name: "Leche",
          qty: 2,
          checked: false,
          note: null,
        },
      ],
    });

    await vi.advanceTimersByTimeAsync(1500);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({ method: "PUT" })
    );
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
