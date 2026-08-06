export const FETCH_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  ERROR: "error",
  SUCCESS: "success",
} as const;

export const SHOPPING_LIST_VIEW = {
  LIST: "list",
  SAVE: "save",
} as const;

export const APP_EVENTS = {
  OPEN_CART: "app:open-cart",
  CLOSE_MOBILE_HEADER_MENU: "app:close-mobile-header-menu",
  TOGGLE_CATALOG_CATEGORIES: "app:toggle-catalog-categories",
} as const;
