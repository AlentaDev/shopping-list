// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { UI_TEXT } from "@src/shared/constants/ui";
import { AppHeader } from "./AppHeader";

const baseProps = {
  authUser: null,
  isUserMenuOpen: false,
  currentPath: "/auth/login",
  isCatalogRoute: false,
  catalogProviderId: null,
  linesCount: 0,
  onNavigateHome: vi.fn(),
  onOpenCart: vi.fn(),
  onNavigateDownloadApp: vi.fn(),
  onNavigateLogin: vi.fn(),
  onNavigateRegister: vi.fn(),
  onToggleUserMenu: vi.fn(),
  onNavigateLists: vi.fn(),
  onCloseUserMenu: vi.fn(),
  onLogout: vi.fn(),
  userMenuRef: createRef<HTMLDivElement>(),
};

describe("app-shell/AppHeader", () => {
  const createResponsiveMatchMedia = ({
    width,
    height = 900,
    pointer = "fine",
  }: {
    width: number;
    height?: number;
    pointer?: "fine" | "coarse";
  }) => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => {
        const normalizedQuery = query.replace(/\s+/g, " ").trim();
        const maxWidthMatch = normalizedQuery.match(/\(max-width:\s*(\d+)px\)/);
        const maxHeightMatch = normalizedQuery.match(/\(max-height:\s*(\d+)px\)/);
        const pointerMatch = normalizedQuery.match(/\(pointer:\s*(coarse|fine)\)/);
        const orientationMatch = normalizedQuery.match(/\(orientation:\s*(landscape|portrait)\)/);

        if (maxWidthMatch) {
          return { matches: width <= Number(maxWidthMatch[1]) };
        }

        if (maxHeightMatch) {
          return { matches: height <= Number(maxHeightMatch[1]) };
        }

        if (pointerMatch) {
          return { matches: pointer === pointerMatch[1] };
        }

        if (orientationMatch) {
          const orientation = width >= height ? "landscape" : "portrait";

          return { matches: orientation === orientationMatch[1] };
        }

        return { matches: false };
      }),
    });
  };

  const createMatchMediaController = (initialWidth: number) => {
    const listeners = new Map<string, Set<(event: { matches: boolean; media: string }) => void>>();
    let width = initialWidth;

    const evaluateQuery = (query: string) => {
      const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/);
      if (!maxWidthMatch) {
        return false;
      }

      return width <= Number(maxWidthMatch[1]);
    };

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        media: query,
        get matches() {
          return evaluateQuery(query);
        },
        addEventListener: (_eventName: string, listener: (event: { matches: boolean; media: string }) => void) => {
          const queryListeners = listeners.get(query) ?? new Set();
          queryListeners.add(listener);
          listeners.set(query, queryListeners);
        },
        removeEventListener: (_eventName: string, listener: (event: { matches: boolean; media: string }) => void) => {
          listeners.get(query)?.delete(listener);
        },
      })),
    });

    return {
      setWidth(nextWidth: number) {
        width = nextWidth;
        listeners.forEach((queryListeners, query) => {
          const event = { matches: evaluateQuery(query), media: query };
          queryListeners.forEach((listener) => listener(event));
        });
      },
    };
  };

  const setMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({ matches })),
    });
  };

  const setMatchMediaForWidth = (width: number) => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => {
        const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/);
        const maxWidth = maxWidthMatch ? Number(maxWidthMatch[1]) : null;

        return {
          matches: maxWidth === null ? false : width <= maxWidth,
        };
      }),
    });
  };

  it("shows Inicio as the active desktop option on home and hides catalog navigation", () => {
    setMatchMedia(false);
    render(<AppHeader {...baseProps} currentPath="/" />);

    expect(screen.getByRole("button", { name: UI_TEXT.APP.TITLE })).toBeInTheDocument();
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inicio" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.APP.CART_BUTTON_LABEL }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(UI_TEXT.APP.CATEGORIES_LABEL),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.APP.DOWNLOAD_APP_LABEL }),
    ).toBeInTheDocument();
  });

  it("muestra login/registro cuando no hay usuario autenticado", () => {
    setMatchMedia(false);
    render(<AppHeader {...baseProps} />);

    const loginButton = screen.getByRole("button", { name: UI_TEXT.APP.LOGIN_LABEL });
    const registerButton = screen.getByRole("button", { name: UI_TEXT.APP.REGISTER_LABEL });

    expect(loginButton).toBeInTheDocument();
    expect(registerButton).toBeInTheDocument();
    expect(loginButton.className).not.toContain("border");
    expect(registerButton.className).not.toContain("border");
  });

  it("abre carrito cuando se hace click en el botón de carrito", async () => {
    setMatchMedia(false);
    const onOpenCart = vi.fn();
    render(<AppHeader {...baseProps} linesCount={2} onOpenCart={onOpenCart} />);

    const cartButton = screen.getByRole("button", {
      name: UI_TEXT.APP.CART_BUTTON_LABEL,
    });

    await userEvent.click(cartButton);

    expect(onOpenCart).toHaveBeenCalledTimes(1);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(cartButton.className).not.toContain("border");
    expect(cartButton.className).not.toContain("bg-");
  });

  it("muestra Mis Listas como acción principal autenticada a la izquierda del carrito", async () => {
    setMatchMedia(false);
    const onNavigateLists = vi.fn();

    render(
      <AppHeader
        {...baseProps}
        authUser={{
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
          postalCode: "28001",
        }}
        onNavigateLists={onNavigateLists}
      />,
    );

    const listsButton = screen.getByRole("button", { name: "Mis Listas" });
    const cartButton = screen.getByRole("button", {
      name: UI_TEXT.APP.CART_BUTTON_LABEL,
    });
    const userBadgeButton = screen.getByRole("button", {
      name: UI_TEXT.AUTH.USER_MENU.MENU_BUTTON_LABEL,
    });

    expect(listsButton).toBeInTheDocument();
    expect(
      listsButton.compareDocumentPosition(cartButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(listsButton.className).not.toContain("border");
    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(userBadgeButton).toHaveTextContent("AL");
    expect(screen.queryByText(/Ada Lovelace/)).not.toBeInTheDocument();

    await userEvent.click(listsButton);

    expect(onNavigateLists).toHaveBeenCalledTimes(1);
  });

  it("renders Mis Listas as active text when the current route is /lists", () => {
    setMatchMedia(false);
    render(
      <AppHeader
        {...baseProps}
        currentPath="/lists"
        authUser={{
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
          postalCode: "28001",
        }}
      />,
    );

    expect(screen.getByText("Mis Listas")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mis Listas" })).not.toBeInTheDocument();
  });

  it("mantiene el menú de usuario operativo con badge de iniciales", async () => {
    setMatchMedia(false);
    const onToggleUserMenu = vi.fn();

    render(
      <AppHeader
        {...baseProps}
        authUser={{
          id: "user-1",
          name: "Grace Brewster Murray Hopper",
          email: "grace@example.com",
          postalCode: "28001",
        }}
        onToggleUserMenu={onToggleUserMenu}
      />,
    );

    const userBadgeButton = screen.getByRole("button", {
      name: UI_TEXT.AUTH.USER_MENU.MENU_BUTTON_LABEL,
    });

    expect(userBadgeButton).toHaveTextContent("GH");
    expect(userBadgeButton.className).not.toContain("border");

    await userEvent.click(userBadgeButton);

    expect(onToggleUserMenu).toHaveBeenCalledTimes(1);
  });

  it("en menú autenticado dispara logout y cierra menú", async () => {
    setMatchMedia(false);
    const onLogout = vi.fn();
    const onCloseUserMenu = vi.fn();

    render(
      <AppHeader
        {...baseProps}
        authUser={{
          id: "user-1",
          name: "Ada",
          email: "ada@example.com",
          postalCode: "28001",
        }}
        isUserMenuOpen
        onLogout={onLogout}
        onCloseUserMenu={onCloseUserMenu}
      />,
    );

    await userEvent.click(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.LOGOUT }),
    );

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onCloseUserMenu).toHaveBeenCalledTimes(1);
  });

  it("renders the current provider logo in a dedicated centered slot between the title and Inicio on desktop catalog routes", () => {
    setMatchMedia(false);
    render(
      <AppHeader
        {...baseProps}
        currentPath="/mercadona/catalog"
        isCatalogRoute
        catalogProviderId="mercadona"
      />,
    );

    const titleButton = screen.getByRole("button", { name: UI_TEXT.APP.TITLE });
    const providerLogo = screen.getByRole("img", {
      name: UI_TEXT.HOME.PROVIDERS.MERCADONA.LOGO_ALT,
    });
    const homeButton = screen.getByRole("button", { name: UI_TEXT.APP.HOME_LABEL });
    const providerLogoSlot = providerLogo.parentElement;

    expect(providerLogo).toHaveAttribute("src", "/images/providers/mercadona/logo.png");
    expect(titleButton.compareDocumentPosition(providerLogo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(providerLogo.compareDocumentPosition(homeButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(providerLogoSlot).not.toBeNull();
    expect(providerLogoSlot).not.toContainElement(titleButton);
    expect(providerLogoSlot).not.toContainElement(homeButton);
    expect(screen.queryByText(UI_TEXT.APP.CATEGORIES_LABEL)).not.toBeInTheDocument();
  });

  it("shows download app as active text on /app", () => {
    setMatchMedia(false);
    render(<AppHeader {...baseProps} currentPath="/app" />);

    expect(screen.getByText(UI_TEXT.APP.DOWNLOAD_APP_LABEL)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: UI_TEXT.APP.DOWNLOAD_APP_LABEL }),
    ).not.toBeInTheDocument();
  });

  it("keeps the mobile header centered while placing hamburger and cart on the left and the user badge on the right", () => {
    setMatchMedia(true);
    render(
      <AppHeader
        {...baseProps}
        authUser={{
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
          postalCode: "28001",
        }}
      />,
    );

    const menuButton = screen.getByRole("button", {
      name: UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL,
    });
    expect(screen.getByRole("button", { name: UI_TEXT.APP.TITLE })).toBeInTheDocument();
    const cartButton = screen.getByRole("button", { name: UI_TEXT.APP.CART_BUTTON_LABEL });
    const userBadgeButton = screen.getByRole("button", {
      name: UI_TEXT.AUTH.USER_MENU.MENU_BUTTON_LABEL,
    });

    expect(menuButton).toBeInTheDocument();
    expect(userBadgeButton).toBeInTheDocument();
    expect(
      menuButton.compareDocumentPosition(cartButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      cartButton.compareDocumentPosition(userBadgeButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows only Login on the right side of the mobile header when unauthenticated", async () => {
    setMatchMedia(true);
    const onNavigateLogin = vi.fn();

    render(<AppHeader {...baseProps} onNavigateLogin={onNavigateLogin} />);

    const menuButton = screen.getByRole("button", {
      name: UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL,
    });
    const cartButton = screen.getByRole("button", {
      name: UI_TEXT.APP.CART_BUTTON_LABEL,
    });
    const loginButton = screen.getByRole("button", { name: UI_TEXT.APP.LOGIN_LABEL });

    expect(
      menuButton.compareDocumentPosition(cartButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      cartButton.compareDocumentPosition(loginButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: UI_TEXT.APP.REGISTER_LABEL }),
    ).not.toBeInTheDocument();

    await userEvent.click(loginButton);

    expect(onNavigateLogin).toHaveBeenCalledTimes(1);
  });

  it("closes the mobile menu when clicking outside the menu container", async () => {
    setMatchMedia(true);
    const user = userEvent.setup();

    render(<AppHeader {...baseProps} />);

    await user.click(screen.getByRole("button", { name: UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL }));

    expect(screen.getByRole("dialog", { name: UI_TEXT.APP.MOBILE_MENU_TITLE })).toBeInTheDocument();

    await user.click(document.body);

    expect(screen.queryByRole("dialog", { name: UI_TEXT.APP.MOBILE_MENU_TITLE })).not.toBeInTheDocument();
  });

  it("keeps mobile menu item clicks inside the menu and preserves navigation", async () => {
    setMatchMedia(true);
    const user = userEvent.setup();
    const onNavigateDownloadApp = vi.fn();

    render(<AppHeader {...baseProps} onNavigateDownloadApp={onNavigateDownloadApp} />);

    await user.click(screen.getByRole("button", { name: UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL }));

    const downloadAppButton = screen.getByRole("button", {
      name: UI_TEXT.APP.DOWNLOAD_APP_LABEL,
    });

    await user.click(downloadAppButton);

    expect(onNavigateDownloadApp).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: UI_TEXT.APP.MOBILE_MENU_TITLE })).not.toBeInTheDocument();
  });

  it("uses the mobile header layout below 768px", () => {
    setMatchMediaForWidth(767);
    render(<AppHeader {...baseProps} />);

    expect(
      screen.getByRole("button", { name: UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_TEXT.APP.CART_BUTTON_LABEL })).toBeInTheDocument();
  });

  it("keeps the desktop header layout at 768px and above", () => {
    setMatchMediaForWidth(768);
    render(<AppHeader {...baseProps} />);

    expect(
      screen.queryByRole("button", { name: UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.APP.CART_BUTTON_LABEL }),
    ).toBeInTheDocument();
  });

  it("uses the mobile catalog header layout on rotated coarse-pointer catalog screens above 768px", () => {
    createResponsiveMatchMedia({
      width: 844,
      height: 390,
      pointer: "coarse",
    });

    render(
      <AppHeader
        {...baseProps}
        currentPath="/mercadona/catalog"
        isCatalogRoute
        catalogProviderId="mercadona"
      />,
    );

    expect(
      screen.getByRole("button", { name: UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.CATEGORIES_PANEL.OPEN_BUTTON_LABEL }),
    ).toBeInTheDocument();
  });

  it("keeps the desktop header layout on rotated coarse-pointer screens above 768px outside catalog routes", () => {
    createResponsiveMatchMedia({
      width: 844,
      height: 390,
      pointer: "coarse",
    });

    render(<AppHeader {...baseProps} currentPath="/lists" />);

    expect(
      screen.queryByRole("button", { name: UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: UI_TEXT.CATEGORIES_PANEL.OPEN_BUTTON_LABEL }),
    ).not.toBeInTheDocument();
  });

  it("opens the mobile menu with active route styling and no categories item", async () => {
    setMatchMedia(true);
    render(
      <AppHeader
        {...baseProps}
        currentPath="/lists"
        authUser={{
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
          postalCode: "28001",
        }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú de navegación" }));

    expect(screen.getByRole("dialog", { name: "Menú de navegación" })).toBeInTheDocument();
    const activeListsItem = screen.getByText(UI_TEXT.APP.MY_LISTS_LABEL);

    expect(activeListsItem).toHaveClass("text-emerald-700");
    expect(activeListsItem).toHaveClass("cursor-default");
    expect(
      screen.queryByRole("button", { name: UI_TEXT.APP.MY_LISTS_LABEL }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryAllByRole("button", { name: UI_TEXT.APP.CATEGORIES_LABEL }),
    ).toHaveLength(0);
  });

  it("renders a compact left-aligned mobile navigation menu", async () => {
    setMatchMedia(true);
    render(<AppHeader {...baseProps} />);

    await userEvent.click(screen.getByRole("button", { name: UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL }));

    const mobileMenu = screen.getByRole("dialog", { name: UI_TEXT.APP.MOBILE_MENU_TITLE });
    const homeButton = screen.getByRole("button", { name: UI_TEXT.APP.HOME_LABEL });
    const downloadAppButton = screen.getByRole("button", { name: UI_TEXT.APP.DOWNLOAD_APP_LABEL });

    expect(mobileMenu).toHaveClass(
      "absolute",
      "left-0",
      "min-w-52",
    );
    expect(homeButton).toHaveClass("w-full", "text-left");
    expect(downloadAppButton).toHaveClass("w-full", "text-left");
  });

  it("shows the provider logo and a tighter labeled categories trigger in the enlarged mobile catalog header", () => {
    setMatchMedia(true);
    render(
      <AppHeader
        {...baseProps}
        currentPath="/mercadona/catalog"
        isCatalogRoute
        catalogProviderId="mercadona"
      />,
    );

    expect(
      screen.getByRole("img", { name: UI_TEXT.HOME.PROVIDERS.MERCADONA.LOGO_ALT }),
    ).toBeInTheDocument();
    const categoriesButton = screen.getByRole("button", {
      name: UI_TEXT.CATEGORIES_PANEL.OPEN_BUTTON_LABEL,
    });

    expect(categoriesButton).toBeInTheDocument();
    expect(categoriesButton).toHaveTextContent(UI_TEXT.APP.CATEGORIES_LABEL);
    expect(categoriesButton.className).toContain("px-2.5");
  });

  it("keeps the mobile cart button size while using a larger icon and a badge anchored to the icon", () => {
    setMatchMedia(true);
    render(<AppHeader {...baseProps} linesCount={12} />);

    const cartButton = screen.getByRole("button", { name: UI_TEXT.APP.CART_BUTTON_LABEL });
    const cartIcon = cartButton.querySelector("svg");
    const cartBadge = screen.getByText("12");
    const cartIconAnchor = cartIcon?.parentElement;

    expect(cartButton).toHaveClass("h-10", "w-10");
    expect(cartIcon).not.toBeNull();
    expect(cartIcon?.className.baseVal ?? cartIcon?.getAttribute("class")).toContain("h-[1.45rem]");
    expect(cartIconAnchor).toHaveClass("relative", "inline-flex");
    expect(cartBadge).toHaveClass("absolute", "-right-1.5", "-top-1.5", "h-4", "min-w-4", "text-[10px]");
  });

  it("updates the header layout automatically when crossing the 768px breakpoint", () => {
    const matchMediaController = createMatchMediaController(768);
    render(<AppHeader {...baseProps} />);

    expect(
      screen.queryByRole("button", { name: UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL }),
    ).not.toBeInTheDocument();

    act(() => {
      matchMediaController.setWidth(767);
    });

    expect(
      screen.getByRole("button", { name: UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL }),
    ).toBeInTheDocument();

    act(() => {
      matchMediaController.setWidth(768);
    });

    expect(
      screen.queryByRole("button", { name: UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_TEXT.APP.CART_BUTTON_LABEL })).toBeInTheDocument();
  });
});
