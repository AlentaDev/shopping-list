// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAutosaveRecovery } from "./useAutosaveRecovery";

const SAMPLE_DRAFT = {
  id: "autosave-1",
  title: "Lista recuperada",
  updatedAt: "2024-01-01T10:00:00.000Z",
  items: [
    {
      id: "item-1",
      kind: "catalog" as const,
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
  onRehydrate?: (draft: {
    title: string;
    items: {
      id: string;
      kind: "catalog";
      name: string;
      qty: number;
      checked: boolean;
      source: "mercadona";
      sourceProductId: string;
      thumbnail?: string | null;
      price?: number | null;
      unitSize?: number | null;
      unitFormat?: string | null;
      unitPrice?: number | null;
      isApproxSize?: boolean;
    }[];
  }) => void;
};

const Harness = ({ enabled = true, onRehydrate }: HarnessProps) => {
  const { draft, handleContinue, handleDiscard } = useAutosaveRecovery({
    enabled,
    onRehydrate,
  });

  return (
    <div>
      {draft ? (
        <div>
          <span>{draft.title}</span>
          <button type="button" onClick={handleContinue}>
            Continuar
          </button>
          <button type="button" onClick={() => void handleDiscard()}>
            Descartar
          </button>
        </div>
      ) : (
        <span>No draft</span>
      )}
    </div>
  );
};

describe("useAutosaveRecovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("carga el autosave remoto cuando está habilitado", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => SAMPLE_DRAFT,
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness />);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(await screen.findByText("Lista recuperada")).toBeInTheDocument();
  });

  it("continúa el borrador y lo normaliza al rehidratar", async () => {
    const user = userEvent.setup();
    const onRehydrate = vi.fn();
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => SAMPLE_DRAFT,
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness onRehydrate={onRehydrate} />);

    await user.click(await screen.findByRole("button", { name: "Continuar" }));

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

    expect(screen.getByText("No draft")).toBeInTheDocument();
  });

  it("descarta el borrador remoto al confirmar", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (_input, init) => {
      if (init?.method === "DELETE") {
        return { ok: true, json: async () => ({}) };
      }

      return { ok: true, json: async () => SAMPLE_DRAFT };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness />);

    await user.click(await screen.findByRole("button", { name: "Descartar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lists/autosave",
        expect.objectContaining({ method: "DELETE", credentials: "include" }),
      );
    });

    expect(screen.getByText("No draft")).toBeInTheDocument();
  });

  it("no vuelve a consultar autosave si ya se revisó en la sesión", () => {
    sessionStorage.setItem("lists.autosaveChecked", "true");
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => SAMPLE_DRAFT,
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("No draft")).toBeInTheDocument();
  });

  it("marca el autosave como revisado al descartar", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (_input, init) => {
      if (init?.method === "DELETE") {
        return { ok: true, json: async () => ({}) };
      }

      return { ok: true, json: async () => SAMPLE_DRAFT };
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<Harness />);

    await user.click(await screen.findByRole("button", { name: "Descartar" }));

    expect(sessionStorage.getItem("lists.autosaveChecked")).toBe("true");
  });
});
