import type { Page, Locator } from "@playwright/test";

export class ProductCatalogPage {
  readonly page: Page;
  readonly productsHeading: Locator;
  readonly productCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productsHeading = page.getByRole("heading", { level: 1 });
    this.productCards = page.getByRole("article");
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  getProduct(name: string): Locator {
    return this.page
      .getByRole("article")
      .filter({ has: this.page.getByRole("heading", { name }) });
  }

  async addToCart(name: string): Promise<void> {
    await this.page
      .getByRole("button", { name: new RegExp(`${name}$`, "i") })
      .click();
  }
}
