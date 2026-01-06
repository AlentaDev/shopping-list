// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoriesPanel from "./CategoriesPanel";

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("CategoriesPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("does not render or fetch when closed", () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    render(<CategoriesPanel isOpen={false} />);

    expect(screen.queryByText("Categorías")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches categories on first open and renders only levels 0 and 1", async () => {
    const fetchMock = vi.fn<[], Promise<FetchResponse>>().mockResolvedValue({
      ok: true,
      json: async () => ({
        categories: [
          { id: "1", name: "Frutas", order: 1, level: 0 },
          { id: "2", name: "Verduras", order: 2, level: 1 },
          { id: "3", name: "Congelados", order: 3, level: 2 },
        ],
      }),
    });
    global.fetch = fetchMock;

    render(<CategoriesPanel isOpen />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(await screen.findByText("Frutas")).toBeInTheDocument();
    expect(screen.getByText("Verduras")).toBeInTheDocument();
    expect(screen.queryByText("Congelados")).toBeNull();
  });

  it("shows retry on error and refetches", async () => {
    const fetchMock = vi
      .fn<[], Promise<FetchResponse>>()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Error" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          categories: [{ id: "1", name: "Panadería", order: 1, level: 0 }],
        }),
      });
    global.fetch = fetchMock;

    render(<CategoriesPanel isOpen />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const retryButton = await screen.findByRole("button", {
      name: "Reintentar",
    });

    await userEvent.click(retryButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Panadería")).toBeInTheDocument();
  });
});
