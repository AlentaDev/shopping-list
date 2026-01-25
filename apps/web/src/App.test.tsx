// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@src/App";
import { AppProviders } from "@src/providers/AppProviders";
import { UI_TEXT } from "@src/shared/constants/ui";

vi.mock("@src/features/shopping-list/services/LocalDraftSyncService", () => ({
  syncLocalDraftToRemoteList: vi.fn().mockResolvedValue(null),
}));

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

const rootCategoriesUrl = "/api/catalog/categories";
const CURRENT_USER_URL = "/api/users/me";
const AUTH_LOGIN_URL = "/api/auth/login";
const AUTH_LOGOUT_URL = "/api/auth/logout";
const AUTH_REGISTER_URL = "/api/auth/register";
const AUTOSAVE_URL = "/api/lists/autosave";
const TEST_POSTAL_CODE = "28001";
const CHILD_CATEGORY_ID = "child-1";
const CHILD_CATEGORY_NAME = "Bollería";
const UNEXPECTED_REQUEST_ERROR = "Unexpected request";
const categoryDetailUrl = (id: string) => `/api/catalog/categories/${id}`;

const productFixtures = {
  ensaimada: {
    id: "prod-1",
    name: "Ensaimada",
    thumbnail: null,
    packaging: null,
    price: 1.5,
    unitSize: null,
    unitFormat: null,
    unitPrice: null,
    isApproxSize: false,
  },
  yogur: {
    id: "prod-2",
    name: "Yogur natural",
    thumbnail: null,
    packaging: null,
    price: 0.9,
    unitSize: null,
    unitFormat: null,
    unitPrice: null,
    isApproxSize: false,
  },
};

describe("App", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset navigation to root path
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
  });

  it("loads default category products on mount", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async (input) => {
        if (input === rootCategoriesUrl) {
          return {
            ok: true,
            json: async () => ({
              categories: [
                { id: "root-1", name: "Panadería", order: 1, level: 0 },
                {
                  id: CHILD_CATEGORY_ID,
                  name: CHILD_CATEGORY_NAME,
                  order: 1,
                  level: 1,
                  parentId: "root-1",
                },
              ],
            }),
          };
        }

        if (input === CURRENT_USER_URL) {
          return {
            ok: false,
            json: async () => ({}),
          };
        }

        if (input === AUTOSAVE_URL) {
          return {
            ok: true,
            json: async () => null,
          };
        }

        if (input === AUTOSAVE_URL) {
          return {
            ok: true,
            json: async () => null,
          };
        }

        if (input === AUTOSAVE_URL) {
          return {
            ok: true,
            json: async () => null,
          };
        }

        if (input === categoryDetailUrl(CHILD_CATEGORY_ID)) {
          return {
            ok: true,
            json: async () => ({
              id: CHILD_CATEGORY_ID,
              name: CHILD_CATEGORY_NAME,
              subcategories: [
                {
                  id: "sub-1",
                  name: "Dulces",
                  products: [productFixtures.ensaimada],
                },
              ],
            }),
          };
        }

        throw new Error(UNEXPECTED_REQUEST_ERROR);
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await screen.findByText("Ensaimada")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(rootCategoriesUrl);
      expect(fetchMock).toHaveBeenCalledWith(
        categoryDetailUrl(CHILD_CATEGORY_ID),
      );
    });
  });

  it("updates products when selecting another category", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async (input) => {
        if (input === rootCategoriesUrl) {
          return {
            ok: true,
            json: async () => ({
              categories: [
                { id: "root-1", name: "Panadería", order: 1, level: 0 },
                { id: "root-2", name: "Lácteos", order: 2, level: 0 },
                {
                  id: CHILD_CATEGORY_ID,
                  name: CHILD_CATEGORY_NAME,
                  order: 1,
                  level: 1,
                  parentId: "root-1",
                },
                {
                  id: "child-2",
                  name: "Yogures",
                  order: 1,
                  level: 1,
                  parentId: "root-2",
                },
              ],
            }),
          };
        }

        if (input === CURRENT_USER_URL) {
          return {
            ok: false,
            json: async () => ({}),
          };
        }

        if (input === categoryDetailUrl(CHILD_CATEGORY_ID)) {
          return {
            ok: true,
            json: async () => ({
              id: CHILD_CATEGORY_ID,
              name: CHILD_CATEGORY_NAME,
              subcategories: [
                {
                  id: "sub-1",
                  name: "Dulces",
                  products: [productFixtures.ensaimada],
                },
              ],
            }),
          };
        }

        if (input === categoryDetailUrl("child-2")) {
          return {
            ok: true,
            json: async () => ({
              id: "child-2",
              name: "Yogures",
              subcategories: [
                {
                  id: "sub-2",
                  name: "Clásicos",
                  products: [productFixtures.yogur],
                },
              ],
            }),
          };
        }

        throw new Error(UNEXPECTED_REQUEST_ERROR);
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await screen.findByText("Ensaimada")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Categorías" }));
    await userEvent.click(screen.getByRole("button", { name: "Lácteos" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Yogures" }),
    );

    expect(await screen.findByText("Yogur natural")).toBeInTheDocument();
  });

  it("shows the user menu and blocks auth screens when logged in", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async (input) => {
      if (input === rootCategoriesUrl) {
        return {
          ok: true,
          json: async () => ({
            categories: [
              { id: "root-1", name: "Panadería", order: 1, level: 0 },
              {
                id: CHILD_CATEGORY_ID,
                name: CHILD_CATEGORY_NAME,
                order: 1,
                level: 1,
                parentId: "root-1",
              },
            ],
          }),
        };
      }

      if (input === CURRENT_USER_URL) {
        return {
          ok: false,
          json: async () => ({}),
        };
      }

      if (input === AUTOSAVE_URL) {
        return {
          ok: true,
          json: async () => null,
        };
      }

      if (input === categoryDetailUrl(CHILD_CATEGORY_ID)) {
        return {
          ok: true,
          json: async () => ({
            id: CHILD_CATEGORY_ID,
            name: CHILD_CATEGORY_NAME,
            subcategories: [
              {
                id: "sub-1",
                name: "Dulces",
                products: [productFixtures.ensaimada],
              },
            ],
          }),
        };
      }

      if (input === AUTH_LOGIN_URL) {
        return {
          ok: true,
          json: async () => ({
            id: "user-1",
            name: "Ada",
            email: "ada@example.com",
            postalCode: TEST_POSTAL_CODE,
          }),
        };
      }

      if (input === AUTH_LOGOUT_URL) {
        return {
          ok: true,
          json: async () => ({ ok: true }),
        };
      }

      throw new Error(UNEXPECTED_REQUEST_ERROR);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.APP.LOGIN_LABEL }),
    );

    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.LOGIN.EMAIL_LABEL),
      "ada@example.com",
    );
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.LOGIN.PASSWORD_LABEL),
      "Password12!A",
    );
    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.AUTH.LOGIN.SUBMIT_LABEL }),
    );

    const greetingLabel = `${UI_TEXT.AUTH.USER_MENU.GREETING_PREFIX} Ada`;

    const menuButton = await screen.findByRole("button", {
      name: UI_TEXT.AUTH.USER_MENU.MENU_BUTTON_LABEL,
    });

    expect(screen.getByText(greetingLabel)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: UI_TEXT.APP.LOGIN_LABEL }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: UI_TEXT.APP.REGISTER_LABEL }),
    ).not.toBeInTheDocument();

    await userEvent.click(menuButton);
    expect(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.PROFILE }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.LISTS }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.LOGOUT }),
    ).toBeInTheDocument();

    await act(async () => {
      window.history.pushState({}, "", "/auth/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(
      await screen.findByText(UI_TEXT.AUTH.ALREADY_LOGGED_IN.LOGIN_MESSAGE),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: UI_TEXT.AUTH.ALREADY_LOGGED_IN.BACK_HOME_LABEL,
      }),
    ).toBeInTheDocument();

    await act(async () => {
      window.history.pushState({}, "", "/auth/register");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(
      await screen.findByText(UI_TEXT.AUTH.ALREADY_LOGGED_IN.REGISTER_MESSAGE),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.LOGOUT }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: UI_TEXT.APP.LOGIN_LABEL }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: UI_TEXT.APP.REGISTER_LABEL }),
      ).toBeInTheDocument();
    });
  });

  it("redirects to login screen after successful registration with welcome toast", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async (input) => {
        if (input === rootCategoriesUrl) {
          return {
            ok: true,
            json: async () => ({ categories: [] }),
          };
        }

        if (input === CURRENT_USER_URL) {
          return {
            ok: false,
            json: async () => ({}),
          };
        }

        if (input === AUTH_REGISTER_URL) {
          return {
            ok: true,
            json: async () => ({
              id: "user-1",
              name: "Ana",
              email: "ana@example.com",
              postalCode: "28001",
            }),
          };
        }

        throw new Error(UNEXPECTED_REQUEST_ERROR);
      },
    );

    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    // Navegar a la pantalla de registro
    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.APP.REGISTER_LABEL }),
    );

    // Llenar el formulario de registro
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.REGISTER.NAME_LABEL),
      "Ana",
    );
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.REGISTER.EMAIL_LABEL),
      "ana@example.com",
    );
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.REGISTER.PASSWORD_LABEL),
      "Password123!",
    );
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.REGISTER.POSTAL_CODE_LABEL),
      "28001",
    );

    // Enviar el formulario
    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.AUTH.REGISTER.SUBMIT_LABEL }),
    );

    // Verificar que se redirige a la pantalla de login
    await waitFor(() => {
      expect(screen.getByText(UI_TEXT.AUTH.LOGIN.TITLE)).toBeInTheDocument();
    });

    // Verificar que aparece el toast de bienvenida
    expect(
      await screen.findByText(/gracias.*ana.*por registrarte/i),
    ).toBeInTheDocument();

    // Verificar que el usuario NO está autenticado (no aparece el menú de usuario)
    expect(
      screen.queryByRole("button", { name: /hola ana/i }),
    ).not.toBeInTheDocument();
  });

  it("closes user menu when clicking outside of it", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async (input) => {
        if (input === rootCategoriesUrl) {
          return {
            ok: true,
            json: async () => ({ categories: [] }),
          };
        }

        if (input === CURRENT_USER_URL) {
          return {
            ok: true,
            json: async () => ({
              id: "user-1",
              name: "Ada",
              email: "ada@example.com",
              postalCode: "28001",
            }),
          };
        }

        if (input === AUTOSAVE_URL) {
          return {
            ok: true,
            json: async () => null,
          };
        }

        throw new Error(UNEXPECTED_REQUEST_ERROR);
      },
    );

    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    // Esperar a que cargue el usuario autenticado
    const userMenuButton = await screen.findByRole("button", {
      name: UI_TEXT.AUTH.USER_MENU.MENU_BUTTON_LABEL,
    });

    // Abrir el menú
    await userEvent.click(userMenuButton);

    // Verificar que el menú está abierto
    expect(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.PROFILE }),
    ).toBeInTheDocument();

    // Hacer clic fuera del menú (por ejemplo, en el título de la app)
    await userEvent.click(screen.getByText(UI_TEXT.APP.TITLE));

    // Verificar que el menú se cerró
    await waitFor(() => {
      expect(
        screen.queryByRole("menuitem", {
          name: UI_TEXT.AUTH.USER_MENU.PROFILE,
        }),
      ).not.toBeInTheDocument();
    });
  });
});
