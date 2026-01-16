import { test, expect, type Page } from "@playwright/test";
import { AuthPage } from "./pages/AuthPage";
import { ProductCatalogPage } from "./pages/ProductCatalogPage";
import { ShoppingListPage } from "./pages/ShoppingListPage";

const USER = {
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

const clearLocalStorage = async (page: Page) => {
  await page.evaluate(() => localStorage.clear());
};

test("auth happy path permite registrar, iniciar sesión y cerrar sesión", async ({
  page,
}, testInfo) => {
  const authPage = new AuthPage(page);
  const uniqueUser = {
    ...USER,
    email: `ana+${testInfo.workerIndex}-${Date.now()}@example.com`,
  };

  await authPage.gotoRegister();
  await clearLocalStorage(page);

  await expect(
    authPage.title,
    "El título de registro debe mostrarse en la pantalla de auth"
  ).toHaveText("Crear cuenta");

  await authPage.register(
    uniqueUser.name,
    uniqueUser.email,
    "Password123!",
    uniqueUser.postalCode
  );

  const userMenuButton = page.getByRole("button", {
    name: `Hola ${uniqueUser.name}`,
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

  await authPage.login(uniqueUser.email, "Password123!");

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

test("catálogo permite abrir panel y seleccionar categoría", async ({ page }) => {
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
    catalogPage.productsHeading,
    "El catálogo debe mostrar la categoría seleccionada"
  ).toHaveText("Frutas");
  await expect(
    catalogPage.getProduct(PRODUCT.name),
    "Debe mostrarse la tarjeta del producto"
  ).toBeVisible();
});

test("carrito añade producto y muestra badge y toast", async ({ page }) => {
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
