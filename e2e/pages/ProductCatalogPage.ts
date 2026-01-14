import type { Page, Locator } from "@playwright/test";

export class ProductCatalogPage {
  readonly page: Page;
  readonly productsHeading: Locator;
  readonly productCards: Locator;
  readonly addToCartButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productsHeading = page.getByRole("heading", { level: 1 });
    this.productCards = page.getByTestId("catalog-product-card");
    this.addToCartButtons = page.getByTestId("catalog-add-button");
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  getProduct(name: string): Locator {
    return this.productCards.filter({
      has: this.page.getByRole("heading", { name }),
    });
  }

  async addToCart(name: string): Promise<void> {
    await this.getProduct(name).getByTestId("catalog-add-button").click();
  }
}
