// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { ListProvider } from "./ListContext";
import { useList } from "./useList";

const TestConsumer = () => {
  const { items, linesCount, total, updateQuantity, removeItem } = useList();

  return (
    <div>
      <span data-testid="lines-count">{linesCount}</span>
      <span data-testid="total-amount">{total.toFixed(2)}</span>
      <span data-testid="first-item-quantity">
        {items[0]?.quantity ?? 0}
      </span>
      <button type="button" onClick={() => updateQuantity("item-1", 3)}>
        Increment
      </button>
      <button type="button" onClick={() => updateQuantity("item-1", 0)}>
        Decrement below min
      </button>
      <button type="button" onClick={() => removeItem("item-2")}>
        Remove
      </button>
    </div>
  );
};

describe("ListContext", () => {
  afterEach(() => {
    cleanup();
  });

  it("exposes derived values and updates quantities", async () => {
    render(
      <ListProvider>
        <TestConsumer />
      </ListProvider>
    );

    expect(screen.getByTestId("lines-count")).toHaveTextContent("3");
    expect(screen.getByTestId("total-amount")).toHaveTextContent("4.60");

    await userEvent.click(screen.getByRole("button", { name: "Increment" }));

    expect(screen.getByTestId("first-item-quantity")).toHaveTextContent("3");

    await userEvent.click(
      screen.getByRole("button", { name: "Decrement below min" })
    );

    expect(screen.getByTestId("first-item-quantity")).toHaveTextContent("1");
  });

  it("removes items and updates the lines count", async () => {
    render(
      <ListProvider>
        <TestConsumer />
      </ListProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.getByTestId("lines-count")).toHaveTextContent("2");
  });
});
