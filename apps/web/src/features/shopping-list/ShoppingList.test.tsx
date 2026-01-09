// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShoppingList from "./ShoppingList";
import { ListProvider } from "../../context/ListContext";
import type { ListItem } from "../../context/ListContextValue";

describe("ShoppingList", () => {
  const totalTestId = "total-value";
  const appleName = "Manzanas Fuji";
  const milkName = "Leche entera";
  const breadName = "Pan integral multicereal extra largo";
  const initialItems: ListItem[] = [
    {
      id: "item-1",
      name: appleName,
      category: "Frutas",
      thumbnail:
        "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=120&q=80",
      price: 1.2,
      quantity: 1,
    },
    {
      id: "item-2",
      name: milkName,
      category: "Bebidas",
      thumbnail: null,
      price: 0.95,
      quantity: 2,
    },
    {
      id: "item-3",
      name: breadName,
      category: "Panadería",
      thumbnail:
        "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=120&q=80",
      price: 1.5,
      quantity: 1,
    },
  ];

  afterEach(() => {
    cleanup();
  });

  it("sorts items by category", () => {
    render(
      <ListProvider initialItems={initialItems}>
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
      <ListProvider initialItems={initialItems}>
        <ShoppingList isOpen onClose={vi.fn()} />
      </ListProvider>
    );

    const decrementButton = screen.getByRole("button", {
      name: `Disminuir cantidad de ${appleName}`,
    });

    expect(decrementButton).toBeDisabled();

    await userEvent.click(decrementButton);

    expect(screen.getByTestId("quantity-item-1")).toHaveTextContent("1");
  });

  it("removes a line item and updates total", async () => {
    render(
      <ListProvider initialItems={initialItems}>
        <ShoppingList isOpen onClose={vi.fn()} />
      </ListProvider>
    );

    expect(screen.getByTestId(totalTestId)).toHaveTextContent(/4,60\s?€/);

    await userEvent.click(
      screen.getByRole("button", { name: `Eliminar ${milkName}` })
    );

    expect(screen.getByTestId(totalTestId)).toHaveTextContent(/2,70\s?€/);
    expect(screen.queryByText(milkName)).toBeNull();
  });

  it("updates total when incrementing quantity", async () => {
    render(
      <ListProvider initialItems={initialItems}>
        <ShoppingList isOpen onClose={vi.fn()} />
      </ListProvider>
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: `Incrementar cantidad de ${appleName}`,
      })
    );

    expect(screen.getByTestId(totalTestId)).toHaveTextContent(/5,80\s?€/);
  });

  it("shows the save step and allows canceling", async () => {
    render(
      <ListProvider initialItems={initialItems}>
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
