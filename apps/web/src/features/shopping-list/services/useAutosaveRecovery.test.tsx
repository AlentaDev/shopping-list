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
};

type HarnessProps = {
  enabled?: boolean;
  onRehydrate?: (draft: AutosaveDraftInput) => void;
  onAutoRestore?: (draft: AutosaveDraftInput) => void;
};

const Harness = ({
  enabled = true,
  onRehydrate,
  onAutoRestore,
}: HarnessProps) => {
  const { conflict, handleKeepLocal, handleKeepRemote } = useAutosaveRecovery({
    enabled,
    onRehydrate,
    onAutoRestore,
  });

  return (
    <div>
      {conflict ? (
        <div>
          <span>Conflict</span>
          <button type="button" onClick={handleKeepLocal}>
            Keep local
          </button>
          <button type="button" onClick={handleKeepRemote}>
            Keep remote
          </button>
        </div>
      ) : (
        <span>No conflict</span>
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

    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
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

  it("muestra conflicto si empatan y difieren", async () => {
    const user = userEvent.setup();
    const onRehydrate = vi.fn();
    const localDraft: LocalDraft = {
      title: "Lista local",
      items: [
        {
          id: "item-local",
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

    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
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

    await user.click(screen.getByRole("button", { name: "Keep remote" }));

    await waitFor(() => {
      expect(onRehydrate).toHaveBeenCalled();
    });

    expect(sessionStorage.getItem("lists.autosaveChecked")).toBe("true");
  });
});
