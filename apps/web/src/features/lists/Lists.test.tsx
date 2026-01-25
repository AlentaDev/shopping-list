// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Lists from "./Lists";
import { UI_TEXT } from "@src/shared/constants/ui";
import { LIST_STATUS } from "./services/listActions";

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
                id: "draft-1",
                title: "Compra semanal",
                updatedAt: "2024-02-01T10:00:00.000Z",
                status: LIST_STATUS.DRAFT,
              },
              {
                id: "completed-1",
                title: "Navidad",
                updatedAt: "2024-02-02T10:00:00.000Z",
                status: LIST_STATUS.COMPLETED,
              },
            ],
          }),
        };
      }

      if (url === "/api/lists/draft-1") {
        return {
          ok: true,
          json: async () => ({
            id: "draft-1",
            title: "Compra semanal",
            updatedAt: "2024-02-01T10:00:00.000Z",
            items: [],
          }),
        };
      }

      if (url === "/api/lists/completed-1/duplicate") {
        return {
          ok: true,
          json: async () => ({
            id: "duplicated-1",
            title: "Navidad",
            updatedAt: "2024-02-03T10:00:00.000Z",
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

    render(<Lists />);

    expect(await screen.findByText("Compra semanal")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.EDIT })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/lists/draft-1");
    });

    await userEvent.click(
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.COMPLETED })
    );

    expect(await screen.findByText("Navidad")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.DUPLICATE })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lists/completed-1/duplicate",
        expect.objectContaining({ method: "POST" })
      );
    });

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.DELETE })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/lists/completed-1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});
