// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShoppingList from "./ShoppingList";
import { ListProvider } from "../../context/ListContext";

describe("ShoppingList", () => {
  const totalTestId = "total-value";

  afterEach(() => {
    cleanup();
  });

  it("sorts items by category", () => {
    render(
      <ListProvider>
        <ShoppingList isOpen onClose={vi.fn()} />
      </ListProvider>
    );

    const itemNames = screen
      .getAllByTestId("item-name")
      .map((item) => item.textContent);

    expect(itemNames).toEqual([
      "Leche entera",
      "Manzanas Fuji",
      "Pan integral multicereal extra largo",
    ]);
  });

  it("never decrements below 1", async () => {
    render(
      <ListProvider>
        <ShoppingList isOpen onClose={vi.fn()} />
      </ListProvider>
    );

    const decrementButton = screen.getByRole("button", {
      name: "Disminuir cantidad de Manzanas Fuji",
    });

    expect(decrementButton).toBeDisabled();

    await userEvent.click(decrementButton);

    expect(screen.getByTestId("quantity-item-1")).toHaveTextContent("1");
  });

  it("removes a line item and updates total", async () => {
    render(
      <ListProvider>
        <ShoppingList isOpen onClose={vi.fn()} />
      </ListProvider>
    );

    expect(screen.getByTestId(totalTestId)).toHaveTextContent("€4.60");

    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar Leche entera" })
    );

    expect(screen.getByTestId(totalTestId)).toHaveTextContent("€2.70");
    expect(screen.queryByText("Leche entera")).toBeNull();
  });

  it("updates total when incrementing quantity", async () => {
    render(
      <ListProvider>
        <ShoppingList isOpen onClose={vi.fn()} />
      </ListProvider>
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: "Incrementar cantidad de Manzanas Fuji",
      })
    );

    expect(screen.getByTestId(totalTestId)).toHaveTextContent("€5.80");
  });

  it("shows the save step and allows canceling", async () => {
    render(
      <ListProvider>
        <ShoppingList isOpen onClose={vi.fn()} />
      </ListProvider>
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar lista" })
    );

    expect(
      screen.getByRole("textbox", { name: "Nombre de la lista" })
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
