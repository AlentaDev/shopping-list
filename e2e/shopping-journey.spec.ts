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
  let loggedInUser: typeof USER | null = null;

  await page.route("**/api/users/me", async (route) => {
    if (loggedInUser) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(loggedInUser),
      });
    } else {
      await route.fulfill({ status: 401, body: "" });
    }
  });

  await page.route("**/api/auth/register", async (route) => {
    loggedInUser = USER;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(USER),
    });
  });

  await page.route("**/api/auth/login", async (route) => {
    loggedInUser = USER;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(USER),
    });
  });

  await page.route("**/api/auth/logout", async (route) => {
    loggedInUser = null;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
};

const mockCatalogRoutes = async (
  page: Page,
  options: { detailFailCount?: number; categories?: typeof CATEGORIES } = {},
) => {
  const { detailFailCount = 0, categories = CATEGORIES } = options;
  let detailCalls = 0;

  await page.route("**/api/catalog/*/categories", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ categories }),
    });
  });

  await page.route("**/api/catalog/*/categories/*", async (route) => {
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

const mockHealthRoute = async (
  page: Page,
  options: { failCount?: number } = {},
) => {
  const { failCount = 0 } = options;
  let attempts = 0;

  await page.route("**/health", async (route) => {
    attempts += 1;

    if (attempts <= failCount) {
      await route.fulfill({ status: 503, body: "" });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
};

test("auth happy path permite registrar con auto-login y cerrar sesión", async ({
  page,
}) => {
  await mockAuthRoutes(page);
  await mockCatalogRoutes(page, {
    categories: EMPTY_CATEGORIES_RESPONSE.categories,
  });

  const authPage = new AuthPage(page);

  await authPage.gotoRegister();
  await clearLocalStorage(page);

  await expect(
    authPage.title,
    "El título de registro debe mostrarse en la pantalla de auth",
  ).toHaveText("Crear cuenta");

  await authPage.register(
    USER.name,
    USER.email,
    "Password123!",
    USER.postalCode,
  );

  // Después del registro, debería redirigir a la pantalla principal
  await page.waitForURL("/");

  const userMenuButton = page.getByRole("button", {
    name: "Abrir menú de usuario",
  });

  await expect(
    userMenuButton,
    "El menú de usuario debe mostrarse tras el registro",
  ).toBeVisible({ timeout: 10000 });

  // Verificar que el texto del botón contiene el nombre del usuario
  await expect(userMenuButton).toContainText(USER.name);

  await userMenuButton.click();
  await page.getByRole("menuitem", { name: "Logout" }).click();

  await expect(
    page.getByRole("button", { name: "Login" }),
    "El botón de login debe aparecer tras cerrar sesión",
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
    "El panel de categorías debe mostrarse al abrirlo",
  ).toBeVisible();

  await page.getByRole("button", { name: "Frescos" }).click();
  await page.getByRole("button", { name: "Frutas" }).click();

  await expect(
    page.getByText("No se pudieron cargar los productos."),
    "Debe mostrarse el error cuando falla la carga de productos",
  ).toBeVisible();

  await page.getByRole("button", { name: "Reintentar" }).click();

  await expect(
    catalogPage.productsHeading,
    "Tras reintentar, el catálogo debe mostrar la categoría seleccionada",
  ).toHaveText("Frutas", { timeout: 10000 });
});

test("carrito añade producto y muestra badge y toast", async ({ page }) => {
  await mockAuthRoutes(page);
  await mockCatalogRoutes(page);

  const catalogPage = new ProductCatalogPage(page);

  await catalogPage.goto();
  await clearLocalStorage(page);

  await expect(
    catalogPage.getProduct(PRODUCT.name),
    "Debe mostrarse la tarjeta del producto",
  ).toBeVisible();

  await catalogPage.addToCart(PRODUCT.name);

  const toastStack = page.getByTestId("toast-stack");

  await expect(
    toastStack,
    "Debe mostrarse el toast al añadir un producto",
  ).toBeVisible();
  await expect(
    toastStack.getByText("Añadido a la lista"),
    "El toast debe confirmar el añadido",
  ).toBeVisible();
  await expect(
    toastStack.getByText(PRODUCT.name),
    "El toast debe incluir el nombre del producto",
  ).toBeVisible();

  const cartButton = page.getByRole("button", { name: "Abrir carrito" });
  await expect(
    cartButton.locator("span"),
    "El badge del carrito debe reflejar las líneas únicas",
  ).toHaveText("1");
});

test("/catalog redirige, espera handshake y luego permite añadir producto", async ({
  page,
}) => {
  await mockAuthRoutes(page);
  await mockCatalogRoutes(page);
  await mockHealthRoute(page, { failCount: 3 });

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(USER.email);
  await page.getByLabel("Contraseña").fill("Password123!");
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.goto("/catalog");

  await expect(page).toHaveURL(/\/mercadona\/catalog$/);

  const waitingBanner = page.getByText(
    "Estamos preparando tu lista para que puedas seguir comprando.",
  );
  const waitingCount = await waitingBanner.count();
  if (waitingCount > 0) {
    await expect(waitingBanner).toBeHidden({ timeout: 15000 });
  }

  const addButton = page.getByTestId("catalog-add-button").first();
  await expect(addButton).toBeEnabled();
  await addButton.click();

  await expect(page.getByRole("button", { name: "Abrir carrito" }).locator("span")).toHaveText("1");
});

test("modal permite ajustar cantidades, eliminar items, estado vacío y volver al catálogo", async ({
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
    "El modal debe abrirse mostrando el título por defecto",
  ).toHaveText("Tu lista");

  await expect(
    listPage.getItem(PRODUCT.name),
    "El producto añadido debe aparecer en la lista",
  ).toBeVisible();

  const decrementButton = listPage.getItem(PRODUCT.name).getByRole("button", {
    name: `Disminuir cantidad de ${PRODUCT.name}`,
    exact: true,
  });

  await expect(
    decrementButton,
    "El botón de decrementar debe estar deshabilitado cuando la cantidad es 1",
  ).toBeDisabled();

  await expect(
    listPage.getItemQuantity(PRODUCT.name),
    "La cantidad inicial debe ser 1",
  ).resolves.toBe(1);

  await listPage.incrementItem(PRODUCT.name);
  await expect(
    listPage.getItemQuantity(PRODUCT.name),
    "La cantidad debe incrementarse",
  ).resolves.toBe(2);

  await listPage.removeItem(PRODUCT.name);

  await expect(
    page.getByText("Tu lista está en modo zen 🧘‍♂️"),
    "El estado vacío debe mostrarse al eliminar todos los items",
  ).toBeVisible();

  await listPage.close();

  // Esperar a que el modal se cierre (dialog desaparece)
  await page.getByRole("dialog").waitFor({
    state: "hidden",
    timeout: 5000,
  });

  await catalogPage.addToCart(PRODUCT.name);
  await page.getByRole("button", { name: "Abrir carrito" }).click();

  await expect(
    listPage.totalValue,
    "El total debe mostrarse con formato de moneda",
  ).toContainText("€");

  await page.getByRole("button", { name: "Añadir más productos" }).click();

  await page.getByRole("dialog").waitFor({
    state: "hidden",
    timeout: 5000,
  });
});
