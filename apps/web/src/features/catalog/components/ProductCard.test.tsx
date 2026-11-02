// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProductCard from "./ProductCard";
import type { CatalogProductSummary } from "@src/features/catalog/services/types";

const productFixture: CatalogProductSummary = {
  id: "prod-1",
  name: "Manzanas Fuji",
  thumbnail: null,
  packaging: null,
  price: 1.2,
  unitSize: null,
  unitFormat: null,
  unitPrice: null,
  isApproxSize: false,
};

describe("ProductCard", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("opens product detail without opening it when adding the product", () => {
    const onSelect = vi.fn();
    const onAdd = vi.fn();
    render(<ProductCard product={productFixture} onAdd={onAdd} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle de Manzanas Fuji" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Añadir Manzanas Fuji" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("opens details when the product name is activated", () => {
    const onSelect = vi.fn();
    render(<ProductCard product={productFixture} onAdd={vi.fn()} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("heading", { name: "Manzanas Fuji" }));

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("shows a temporary adding state and ignores repeated clicks", async () => {
    vi.useFakeTimers();
    const onAdd = vi.fn();

    render(<ProductCard product={productFixture} onAdd={onAdd} />);

    const addButton = screen.getByRole("button", {
      name: "Añadir Manzanas Fuji",
    });

    fireEvent.click(addButton);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(addButton).toBeDisabled();
    expect(addButton).toHaveTextContent("Añadiendo");

    fireEvent.click(addButton);

    expect(onAdd).toHaveBeenCalledTimes(1);

    expect(addButton).toBeDisabled();
  });

  it("keeps other product buttons enabled while one is adding", () => {
    vi.useFakeTimers();
    const onAddFirst = vi.fn();
    const onAddSecond = vi.fn();

    render(
      <>
        <ProductCard product={productFixture} onAdd={onAddFirst} />
        <ProductCard
          product={{ ...productFixture, id: "prod-2", name: "Leche entera" }}
          onAdd={onAddSecond}
        />
      </>,
    );

    const firstButton = screen.getByRole("button", {
      name: "Añadir Manzanas Fuji",
    });
    const secondButton = screen.getByRole("button", {
      name: "Añadir Leche entera",
    });

    fireEvent.click(firstButton);
    fireEvent.click(secondButton);

    expect(onAddFirst).toHaveBeenCalledTimes(1);
    expect(onAddSecond).toHaveBeenCalledTimes(1);
    expect(firstButton).toBeDisabled();
    expect(secondButton).toBeDisabled();
    expect(secondButton).toHaveTextContent("Añadiendo");
  });
});
