import type { Locator, Page } from "@playwright/test";

export class ShoppingListPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly totalValue: Locator;
  readonly closeBackdrop: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.heading = this.dialog.getByRole("heading", { level: 2 });
    this.totalValue = this.dialog.getByTestId("total-value");
    this.closeBackdrop = page.getByTestId("list-modal-backdrop");
  }

  getItem(name: string): Locator {
    return this.dialog
      .getByRole("listitem")
      .filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async incrementItem(name: string): Promise<void> {
    await this.getItem(name)
      .getByRole("button", {
        name: `Incrementar cantidad de ${name}`,
        exact: true,
      })
      .click();
  }

  async decrementItem(name: string): Promise<void> {
    await this.getItem(name)
      .getByRole("button", {
        name: `Disminuir cantidad de ${name}`,
        exact: true,
      })
      .click();
  }

  async removeItem(name: string): Promise<void> {
    await this.getItem(name)
      .getByRole("button", { name: `Eliminar ${name}`, exact: true })
      .click();

    // Confirmar la eliminación en el modal de confirmación
    await this.page
      .getByRole("button", { name: "Sí, eliminar", exact: true })
      .click();
  }

  async getItemQuantity(name: string): Promise<number> {
    const quantityText = await this.getItem(name)
      .locator('[data-testid^="quantity-"]')
      .innerText();

    return Number(quantityText);
  }

  async close(): Promise<void> {
    // Click en el botón "Cerrar" en lugar del backdrop
    await this.dialog.getByRole("button", { name: "Cerrar" }).click();
  }
}
