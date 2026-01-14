import { test, expect, type Page } from "@playwright/test";
import { AuthPage } from "./pages/AuthPage";
import { ProductCatalogPage } from "./pages/ProductCatalogPage";
import { ShoppingListPage } from "./pages/ShoppingListPage";

const USER = {
  id: "user-1",
  name: "Ana",
  email: "ana@example.com",
  postalCode: "28001",
};

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

const EMPTY_CATEGORIES_RESPONSE = { categories: [] };

const DETAIL_SUCCESS_RESPONSE = CATEGORY_DETAIL;

const clearLocalStorage = async (page: Page) => {
  await page.evaluate(() => localStorage.clear());
};

const mockAuthRoutes = async (page: Page) => {
  await page.route("**/api/users/me", async (route) => {
    await route.fulfill({ status: 401, body: "" });
  });

  await page.route("**/api/auth/register", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(USER),
    });
  });

  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(USER),
    });
  });

  await page.route("**/api/auth/logout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
};

const mockCatalogRoutes = async (
  page: Page,
  options: { detailFailCount?: number; categories?: typeof CATEGORIES } = {}
) => {
  const { detailFailCount = 0, categories = CATEGORIES } = options;
  let detailCalls = 0;

  await page.route("**/api/catalog/categories", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ categories }),
    });
  });

  await page.route("**/api/catalog/categories/*", async (route) => {
    detailCalls += 1;

    if (detailCalls <= detailFailCount) {
      await route.fulfill({ status: 500, body: "" });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(DETAIL_SUCCESS_RESPONSE),
    });
  });
};

test("auth happy path permite registrar, iniciar sesión y cerrar sesión", async ({
  page,
}) => {
  await mockAuthRoutes(page);
  await mockCatalogRoutes(page, { categories: EMPTY_CATEGORIES_RESPONSE.categories });

  const authPage = new AuthPage(page);

  await authPage.gotoRegister();
  await clearLocalStorage(page);

  await expect(
    authPage.title,
    "El título de registro debe mostrarse en la pantalla de auth"
  ).toHaveText("Crear cuenta");

  await authPage.register(USER.name, USER.email, "Password123!", USER.postalCode);

  const userMenuButton = page.getByRole("button", {
    name: `Hola ${USER.name}`,
  });

  await expect(
    userMenuButton,
    "El menú de usuario debe mostrarse tras el registro"
  ).toBeVisible();

  await userMenuButton.click();
  await page.getByRole("menuitem", { name: "Logout" }).click();

  await expect(
    page.getByRole("button", { name: "Login" }),
    "El botón de login debe aparecer tras cerrar sesión"
  ).toBeVisible();

  await authPage.gotoLogin();

  await authPage.login(USER.email, "Password123!");

  await expect(
    userMenuButton,
    "El menú de usuario debe mostrarse tras iniciar sesión"
  ).toBeVisible();

  await userMenuButton.click();
  await page.getByRole("menuitem", { name: "Logout" }).click();

  await expect(
    page.getByRole("button", { name: "Login" }),
    "El usuario debe volver al estado anónimo tras logout"
  ).toBeVisible();
});

test("catálogo permite abrir panel, seleccionar categoría y reintentar carga", async ({
  page,
}) => {
  await mockAuthRoutes(page);
  await mockCatalogRoutes(page, { detailFailCount: 2 });

  const catalogPage = new ProductCatalogPage(page);

  await catalogPage.goto();
  await clearLocalStorage(page);

  const categoriesButton = page.getByRole("button", { name: "Categorías" });
  await categoriesButton.click();

  await expect(
    page.getByRole("heading", { name: "Categorías" }),
    "El panel de categorías debe mostrarse al abrirlo"
  ).toBeVisible();

  await page.getByRole("button", { name: "Frescos" }).click();
  await page.getByRole("button", { name: "Frutas" }).click();

  await expect(
    page.getByText("No se pudieron cargar los productos."),
    "Debe mostrarse el error cuando falla la carga de productos"
  ).toBeVisible();

  await page.getByRole("button", { name: "Reintentar" }).click();

  await expect(
    catalogPage.productsHeading,
    "Tras reintentar, el catálogo debe mostrar la categoría seleccionada"
  ).toHaveText("Frutas");
});

test("carrito añade producto y muestra badge y toast", async ({ page }) => {
  await mockAuthRoutes(page);
  await mockCatalogRoutes(page);

  const catalogPage = new ProductCatalogPage(page);

  await catalogPage.goto();
  await clearLocalStorage(page);

  await expect(
    catalogPage.getProduct(PRODUCT.name),
    "Debe mostrarse la tarjeta del producto"
  ).toBeVisible();

  await catalogPage.addToCart(PRODUCT.name);

  const toastStack = page.getByTestId("toast-stack");

  await expect(
    toastStack,
    "Debe mostrarse el toast al añadir un producto"
  ).toBeVisible();
  await expect(
    toastStack.getByText("Añadido a la lista"),
    "El toast debe confirmar el añadido"
  ).toBeVisible();
  await expect(
    toastStack.getByText(PRODUCT.name),
    "El toast debe incluir el nombre del producto"
  ).toBeVisible();

  const cartButton = page.getByRole("button", { name: "Abrir carrito" });
  await expect(
    cartButton.locator("span"),
    "El badge del carrito debe reflejar las líneas únicas"
  ).toHaveText("1");
});

test("modal permite ajustar cantidades, eliminar items, estado vacío y guardar nombre", async ({
  page,
}) => {
  await mockAuthRoutes(page);
  await mockCatalogRoutes(page);

  const catalogPage = new ProductCatalogPage(page);
  const listPage = new ShoppingListPage(page);

  await catalogPage.goto();
  await clearLocalStorage(page);

  await catalogPage.addToCart(PRODUCT.name);

  await page.getByRole("button", { name: "Abrir carrito" }).click();

  await expect(
    listPage.heading,
    "El modal debe abrirse mostrando el título por defecto"
  ).toHaveText("Tu lista");

  await expect(
    listPage.getItem(PRODUCT.name),
    "El producto añadido debe aparecer en la lista"
  ).toBeVisible();

  await listPage.decrementItem(PRODUCT.name);
  await expect(
    listPage.getItemQuantity(PRODUCT.name),
    "La cantidad no debe bajar de 1 al decrementar"
  ).resolves.toBe(1);

  await listPage.incrementItem(PRODUCT.name);
  await expect(
    listPage.getItemQuantity(PRODUCT.name),
    "La cantidad debe incrementarse"
  ).resolves.toBe(2);

  await listPage.removeItem(PRODUCT.name);

  await expect(
    page.getByText("Tu lista está en modo zen 🧘‍♂️"),
    "El estado vacío debe mostrarse al eliminar todos los items"
  ).toBeVisible();

  await listPage.close();

  await catalogPage.addToCart(PRODUCT.name);
  await page.getByRole("button", { name: "Abrir carrito" }).click();

  await page.getByRole("button", { name: "Guardar lista" }).click();
  await page.getByLabel("Nombre de la lista").fill("Compra semanal");
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(
    listPage.heading,
    "El título del modal debe actualizarse con el nombre guardado"
  ).toHaveText("Compra semanal");

  await expect(
    listPage.totalValue,
    "El total debe mostrarse con formato de moneda"
  ).toContainText("€");
});
