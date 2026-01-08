// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShoppingList from "./ShoppingList";

describe("ShoppingList", () => {
  const totalTestId = "total-value";

  afterEach(() => {
    cleanup();
  });

  it("sorts items by category", () => {
    render(<ShoppingList isOpen onClose={vi.fn()} />);

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
    render(<ShoppingList isOpen onClose={vi.fn()} />);

    const decrementButton = screen.getByRole("button", {
      name: "Disminuir cantidad de Manzanas Fuji",
    });

    expect(decrementButton).toBeDisabled();

    await userEvent.click(decrementButton);

    expect(screen.getByTestId("quantity-item-1")).toHaveTextContent("1");
  });

  it("removes a line item and updates total and lines count", async () => {
    const onLinesCountChange = vi.fn();

    render(
      <ShoppingList
        isOpen
        onClose={vi.fn()}
        onLinesCountChange={onLinesCountChange}
      />
    );

    expect(screen.getByTestId(totalTestId)).toHaveTextContent("€4.60");

    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar Leche entera" })
    );

    expect(screen.getByTestId(totalTestId)).toHaveTextContent("€2.70");
    expect(onLinesCountChange).toHaveBeenLastCalledWith(2);
  });

  it("updates total when incrementing quantity", async () => {
    render(<ShoppingList isOpen onClose={vi.fn()} />);

    await userEvent.click(
      screen.getByRole("button", {
        name: "Incrementar cantidad de Manzanas Fuji",
      })
    );

    expect(screen.getByTestId(totalTestId)).toHaveTextContent("€5.80");
  });

  it("shows the save step and allows canceling", async () => {
    render(<ShoppingList isOpen onClose={vi.fn()} />);

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
