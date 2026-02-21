// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListsContainer from "./ListsContainer";
import { UI_TEXT } from "@src/shared/constants/ui";
import { LIST_STATUS } from "@src/shared/domain/listStatus";

const { showToastMock } = vi.hoisted(() => ({
  showToastMock: vi.fn(),
}));

vi.mock("@src/context/useToast", () => ({
  useToast: () => ({
    showToast: showToastMock,
  }),
}));

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("ListsContainer", () => {
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

    render(<ListsContainer onOpenList={vi.fn()} />);

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
          json: async () => ({ id: "duplicated-1" }),
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

    render(<ListsContainer onOpenList={vi.fn()} />);

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

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/lists/completed-1/close",
      expect.anything(),
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

});
