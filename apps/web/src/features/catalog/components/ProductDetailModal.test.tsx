// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProductDetailModal from "./ProductDetailModal";
import type { CatalogProductDetail, CatalogProductSummary } from "../services/types";

const product: CatalogProductSummary = {
  id: "prod-1",
  name: "Manzanas Fuji",
  thumbnail: "https://example.test/front.jpg",
  packaging: null,
  price: 1.2,
  unitSize: null,
  unitFormat: "kg",
  unitPrice: 2.4,
  isApproxSize: false,
};
const detail: CatalogProductDetail = {
  id: "prod-1",
  name: "Manzanas Fuji",
  brand: "Hacendado",
  origin: "España",
  photos: ["https://example.test/front.jpg", "https://example.test/label.jpg"],
  description: "Descripción segura",
  usageInstructions: null,
  storageInstructions: "Conservar refrigerado",
  ingredients: "Ingredientes: leche, harina",
  allergens: "Alérgenos: Puede contener frutos de cáscara",
};

describe("ProductDetailModal", () => {
  afterEach(cleanup);

  it("shows product details, keeps card pricing and navigates its photos safely", () => {
    render(
      <ProductDetailModal
        product={product}
        detail={detail}
        loading={false}
        error={null}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        triggerElement={null}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Manzanas Fuji" })).toBeInTheDocument();
    expect(screen.getByText("Hacendado")).toBeInTheDocument();
    expect(screen.getByText("España")).toBeInTheDocument();
    expect(screen.getByText("Ingredientes: leche, harina")).toBeInTheDocument();
    expect(screen.getByText("Alérgenos: Puede contener frutos de cáscara")).toBeInTheDocument();
    expect(document.querySelector("[onerror], script")).not.toBeInTheDocument();
    expect(screen.getByText(/2,40.*\/ kg/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente foto" }));
    expect(screen.getByRole("img", { name: "Manzanas Fuji" })).toHaveAttribute(
      "src",
      "https://example.test/label.jpg",
    );
  });

  it("shows loading and retryable errors", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <ProductDetailModal product={product} detail={null} loading error={null} onClose={vi.fn()} onRetry={onRetry} triggerElement={null} />,
    );
    expect(screen.getByText("Cargando detalles del producto...")).toBeInTheDocument();

    rerender(
      <ProductDetailModal product={product} detail={null} loading={false} error="fallo" onClose={vi.fn()} onRetry={onRetry} triggerElement={null} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("keeps Tab navigation inside the dialog", () => {
    render(
      <ProductDetailModal product={product} detail={detail} loading={false} error={null} onClose={vi.fn()} onRetry={vi.fn()} triggerElement={null} />,
    );
    const dialog = screen.getByRole("dialog");
    const closeButton = within(dialog).getByRole("button", { name: "Cerrar detalle" });
    const lastDialogButton = within(dialog).getByRole("button", { name: "Siguiente foto" });
    lastDialogButton.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);

    closeButton.focus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastDialogButton);
  });

  it("closes the dialog on Escape", () => {
    const onClose = vi.fn();
    render(
      <ProductDetailModal product={product} detail={detail} loading={false} error={null} onClose={onClose} onRetry={vi.fn()} triggerElement={null} />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
