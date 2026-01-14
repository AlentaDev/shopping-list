// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { AppProviders } from "./providers/AppProviders";
import { UI_TEXT } from "./shared/constants/ui";

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

const rootCategoriesUrl = "/api/catalog/categories";
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
                  id: "child-1",
                  name: "Bollería",
                  order: 1,
                  level: 1,
                  parentId: "root-1",
                },
              ],
            }),
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
      }
    );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AppProviders>
        <App />
      </AppProviders>
    );

    expect(await screen.findByText("Ensaimada")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(rootCategoriesUrl);
      expect(fetchMock).toHaveBeenCalledWith(
        categoryDetailUrl(CHILD_CATEGORY_ID)
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
      }
    );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AppProviders>
        <App />
      </AppProviders>
    );

    expect(await screen.findByText("Ensaimada")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Categorías" }));
    await userEvent.click(screen.getByRole("button", { name: "Lácteos" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Yogures" })
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
                id: "child-1",
                name: "Bollería",
                order: 1,
                level: 1,
                parentId: "root-1",
              },
            ],
          }),
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

      if (input === "/api/auth/login") {
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

      if (input === "/api/auth/logout") {
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
      </AppProviders>
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.APP.LOGIN_LABEL })
    );

    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.LOGIN.EMAIL_LABEL),
      "ada@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.LOGIN.PASSWORD_LABEL),
      "Password12!A"
    );
    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.AUTH.LOGIN.SUBMIT_LABEL })
    );

    const greetingLabel = `${UI_TEXT.AUTH.USER_MENU.GREETING_PREFIX} Ada`;

    const menuButton = await screen.findByRole("button", {
      name: UI_TEXT.AUTH.USER_MENU.MENU_BUTTON_LABEL,
    });

    expect(screen.getByText(greetingLabel)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: UI_TEXT.APP.LOGIN_LABEL })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: UI_TEXT.APP.REGISTER_LABEL })
    ).not.toBeInTheDocument();

    await userEvent.click(menuButton);
    expect(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.PROFILE })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.LISTS })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.LOGOUT })
    ).toBeInTheDocument();

    await act(async () => {
      window.history.pushState({}, "", "/auth/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(
      await screen.findByText(UI_TEXT.AUTH.ALREADY_LOGGED_IN.LOGIN_MESSAGE)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: UI_TEXT.AUTH.ALREADY_LOGGED_IN.BACK_HOME_LABEL,
      })
    ).toBeInTheDocument();

    await act(async () => {
      window.history.pushState({}, "", "/auth/register");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(
      await screen.findByText(UI_TEXT.AUTH.ALREADY_LOGGED_IN.REGISTER_MESSAGE)
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.LOGOUT })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: UI_TEXT.APP.LOGIN_LABEL })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: UI_TEXT.APP.REGISTER_LABEL })
      ).toBeInTheDocument();
    });
  });
});
