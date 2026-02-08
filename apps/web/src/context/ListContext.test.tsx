// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { ListProvider } from "./ListContext";
import { useList } from "./useList";
import type { ListItem } from "./ListContextValue";

const FIRST_ITEM_QUANTITY_TEST_ID = "first-item-quantity";
const LINES_COUNT_TEST_ID = "lines-count";
const TOTAL_AMOUNT_TEST_ID = "total-amount";

const TestConsumer = () => {
  const {
    items,
    linesCount,
    total,
    addItem,
    setItems,
    updateQuantity,
    removeItem,
  } = useList();

  return (
    <div>
      <span data-testid={LINES_COUNT_TEST_ID}>{linesCount}</span>
      <span data-testid={TOTAL_AMOUNT_TEST_ID}>{total.toFixed(2)}</span>
      <span data-testid={FIRST_ITEM_QUANTITY_TEST_ID}>
        {items[0]?.quantity ?? 0}
      </span>
      <button
        type="button"
        onClick={() =>
          addItem({
            id: "item-1",
            name: "Manzanas Fuji",
            category: "Frutas",
            thumbnail: null,
            price: 1.2,
            quantity: 1,
          })
        }
      >
        Add again
      </button>
      <button
        type="button"
        onClick={() =>
          addItem({
            id: "new-item",
            name: "Peras",
            category: "Frutas",
            thumbnail: null,
            price: 1.5,
            quantity: 1,
          })
        }
      >
        Add new
      </button>
      <button type="button" onClick={() => updateQuantity("item-1", 3)}>
        Increment
      </button>
      <button type="button" onClick={() => updateQuantity("item-1", 0)}>
        Decrement below min
      </button>
      <button type="button" onClick={() => updateQuantity("item-1", 120)}>
        Increment above max
      </button>
      <button type="button" onClick={() => removeItem("item-2")}>
        Remove
      </button>
      <button
        type="button"
        onClick={() =>
          setItems([
            {
              id: "item-4",
              name: "Café molido",
              category: "Despensa",
              thumbnail: null,
              price: 3.1,
              quantity: 1,
            },
          ])
        }
      >
        Replace all
      </button>
    </div>
  );
};

describe("ListContext", () => {
  const initialItems: ListItem[] = [
    {
      id: "item-1",
      name: "Manzanas Fuji",
      category: "Frutas",
      thumbnail: null,
      price: 1.2,
      quantity: 1,
    },
    {
      id: "item-2",
      name: "Leche entera",
      category: "Bebidas",
      thumbnail: null,
      price: 0.95,
      quantity: 2,
    },
    {
      id: "item-3",
      name: "Pan integral multicereal extra largo",
      category: "Panadería",
      thumbnail: null,
      price: 1.5,
      quantity: 1,
    },
  ];

  afterEach(() => {
    cleanup();
  });

  it("exposes derived values and updates quantities", async () => {
    render(
      <ListProvider initialItems={initialItems}>
        <TestConsumer />
      </ListProvider>
    );

    expect(screen.getByTestId(LINES_COUNT_TEST_ID)).toHaveTextContent("3");
    expect(screen.getByTestId(TOTAL_AMOUNT_TEST_ID)).toHaveTextContent("4.60");

    await userEvent.click(screen.getByRole("button", { name: "Increment" }));

    expect(screen.getByTestId(FIRST_ITEM_QUANTITY_TEST_ID)).toHaveTextContent(
      "3"
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Decrement below min" })
    );

    expect(screen.getByTestId(FIRST_ITEM_QUANTITY_TEST_ID)).toHaveTextContent(
      "1"
    );
  });

  it("removes items and updates the lines count", async () => {
    render(
      <ListProvider initialItems={initialItems}>
        <TestConsumer />
      </ListProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.getByTestId(LINES_COUNT_TEST_ID)).toHaveTextContent("2");
  });

  it("clamps quantity to the max limit", async () => {
    render(
      <ListProvider initialItems={initialItems}>
        <TestConsumer />
      </ListProvider>
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Increment above max" })
    );

    expect(screen.getByTestId(FIRST_ITEM_QUANTITY_TEST_ID)).toHaveTextContent(
      "99"
    );
  });

  it("increments quantity when adding the same product again", async () => {
    render(
      <ListProvider initialItems={initialItems}>
        <TestConsumer />
      </ListProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Add again" }));

    expect(screen.getByTestId(FIRST_ITEM_QUANTITY_TEST_ID)).toHaveTextContent(
      "2"
    );
  });

  it("initializes with empty array when no initialItems provided", () => {
    render(
      <ListProvider>
        <TestConsumer />
      </ListProvider>
    );

    expect(screen.getByTestId(LINES_COUNT_TEST_ID)).toHaveTextContent("0");
    expect(screen.getByTestId(TOTAL_AMOUNT_TEST_ID)).toHaveTextContent("0.00");
  });

  it("adds a new item to the list", async () => {
    render(
      <ListProvider initialItems={initialItems}>
        <TestConsumer />
      </ListProvider>
    );

    expect(screen.getByTestId(LINES_COUNT_TEST_ID)).toHaveTextContent("3");

    await userEvent.click(screen.getByRole("button", { name: "Add new" }));

    expect(screen.getByTestId(LINES_COUNT_TEST_ID)).toHaveTextContent("4");
  });

  it("replaces items when setItems is called", async () => {
    render(
      <ListProvider initialItems={initialItems}>
        <TestConsumer />
      </ListProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Replace all" }));

    expect(screen.getByTestId(LINES_COUNT_TEST_ID)).toHaveTextContent("1");
    expect(screen.getByTestId(TOTAL_AMOUNT_TEST_ID)).toHaveTextContent("3.10");
  });
});
