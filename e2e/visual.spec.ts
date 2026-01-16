import { test, expect, type Page } from "@playwright/test";
import { ProductCatalogPage } from "./pages/ProductCatalogPage";

const PRODUCT = {
  id: "prod-1",
  name: "Manzana",
  thumbnail: null,
  packaging: null,
  price: 1.5,
  unitSize: 1,
  unitFormat: "kg",
  unitPrice: 1.5,
  isApproxSize: false,
};

const clearLocalStorage = async (page: Page) => {
  await page.evaluate(() => localStorage.clear());
};

test("visual: homepage con catálogo", async ({ page }) => {
  const catalogPage = new ProductCatalogPage(page);

  await catalogPage.goto();
  await clearLocalStorage(page);
  await page.reload();

  await expect(
    page,
    "La homepage con catálogo debe mantenerse estable visualmente"
  ).toHaveScreenshot("homepage-catalog.png", { maxDiffPixelRatio: 0.05 });
});

test("visual: lista con items", async ({ page }) => {
  const catalogPage = new ProductCatalogPage(page);

  await catalogPage.goto();
  await clearLocalStorage(page);
  await page.reload();

  await catalogPage.addToCart(PRODUCT.name);
  await page.getByRole("button", { name: "Abrir carrito" }).click();

  await expect(
    page,
    "El modal de la lista con items debe mantenerse estable visualmente"
  ).toHaveScreenshot("shopping-list-with-items.png", {
    maxDiffPixelRatio: 0.05,
  });
});

test("visual: homepage con login", async ({ page }) => {
  await page.goto("/auth/login");
  await clearLocalStorage(page);
  await page.reload();

  await expect(
    page,
    "La pantalla de login debe mantenerse estable visualmente"
  ).toHaveScreenshot("homepage-login.png", { maxDiffPixelRatio: 0.05 });
});

test("visual: homepage con registro", async ({ page }) => {
  await page.goto("/auth/register");
  await clearLocalStorage(page);
  await page.reload();

  await expect(
    page,
    "La pantalla de registro debe mantenerse estable visualmente"
  ).toHaveScreenshot("homepage-register.png", { maxDiffPixelRatio: 0.05 });
});
