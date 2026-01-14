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

const CATEGORIES = [
  {
    id: "cat-1",
    name: "Frescos",
    order: 1,
    level: 0,
  },
  {
    id: "cat-1-1",
    name: "Frutas",
    order: 1,
    level: 1,
    parentId: "cat-1",
  },
];

const CATEGORY_DETAIL = {
  name: "Frutas",
  subcategories: [
    {
      name: "Frutas frescas",
      products: [PRODUCT],
    },
  ],
};

const clearLocalStorage = async (page: Page) => {
  await page.evaluate(() => localStorage.clear());
};

const mockAuthRoutes = async (page: Page) => {
  await page.route("**/api/users/me", async (route) => {
    await route.fulfill({ status: 401, body: "" });
  });
};

const mockCatalogRoutes = async (page: Page) => {
  await page.route("**/api/catalog/categories", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ categories: CATEGORIES }),
    });
  });

  await page.route("**/api/catalog/categories/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(CATEGORY_DETAIL),
    });
  });
};

test("visual: homepage con catálogo", async ({ page }) => {
  await mockAuthRoutes(page);
  await mockCatalogRoutes(page);

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
  await mockAuthRoutes(page);
  await mockCatalogRoutes(page);

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
  await mockAuthRoutes(page);

  await page.goto("/auth/login");
  await clearLocalStorage(page);
  await page.reload();

  await expect(
    page,
    "La pantalla de login debe mantenerse estable visualmente"
  ).toHaveScreenshot("homepage-login.png", { maxDiffPixelRatio: 0.05 });
});

test("visual: homepage con registro", async ({ page }) => {
  await mockAuthRoutes(page);

  await page.goto("/auth/register");
  await clearLocalStorage(page);
  await page.reload();

  await expect(
    page,
    "La pantalla de registro debe mantenerse estable visualmente"
  ).toHaveScreenshot("homepage-register.png", { maxDiffPixelRatio: 0.05 });
});
