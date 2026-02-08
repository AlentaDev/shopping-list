// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Lists from "./Lists";
import { UI_TEXT } from "@src/shared/constants/ui";
import { LIST_STATUS } from "@src/shared/domain/listStatus";

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("Lists", () => {
  it("dispara requests al hacer acciones", async () => {
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
              },
              {
                id: "item-2",
                kind: "catalog",
                name: "Pan",
                qty: 1,
                checked: false,
                updatedAt: "2024-02-01T11:35:00.000Z",
              },
            ],
          }),
        };
      }

      if (url === "/api/lists/active-1/complete" && init?.method === "POST") {
        return {
          ok: true,
          json: async () => ({
            id: "active-1",
            status: LIST_STATUS.COMPLETED,
            updatedAt: "2024-02-01T12:30:00.000Z",
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
            updatedAt: "2024-02-03T10:00:00.000Z",
            activatedAt: null,
            itemCount: 0,
            isEditing: false,
            items: [],
            status: LIST_STATUS.DRAFT,
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

    render(<Lists onOpenList={onOpenList} />);

    expect(await screen.findByText("Despensa")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.COMPLETE })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/lists/active-1");
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lists/active-1/complete",
        expect.objectContaining({ method: "POST" })
      );
    });

    await userEvent.click(
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.COMPLETED })
    );

    expect(await screen.findByText("Navidad")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.REUSE })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lists/completed-1/reuse",
        expect.objectContaining({ method: "POST" })
      );
    });

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.DELETE })
    );

    await waitFor(() => {
      expect(
        screen.getByText(UI_TEXT.LISTS.DELETE_CONFIRMATION.TITLE)
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", {
        name: UI_TEXT.LISTS.DELETE_CONFIRMATION.CONFIRM_LABEL,
      })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lists/completed-1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});
