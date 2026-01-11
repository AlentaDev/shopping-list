/**
 * UI Text Strings - Centralized UI messages
 * Extracted to avoid duplicated strings throughout the application
 */
export const UI_TEXT = {
  APP: {
    TITLE: "La lista de la compra",
    CART_BUTTON_LABEL: "Abrir carrito",
    CATEGORIES_LABEL: "Categorías",
    LOGIN_LABEL: "Login",
    REGISTER_LABEL: "Registro",
  },
  CATALOG: {
    TITLE: "Catálogo",
    LOAD_PRODUCTS_ERROR_MESSAGE: "No se pudieron cargar los productos.",
    LOADING_PRODUCTS_MESSAGE: "Cargando productos...",
    RETRY_BUTTON_LABEL: "Reintentar",
    TOAST_ADDED_MESSAGE: "Añadido a la lista",
    EMPTY_PRODUCTS_TITLE: "No hay productos disponibles",
    EMPTY_PRODUCTS_SUBTITLE: "Prueba a seleccionar otra categoría.",
    EMPTY_CATEGORIES_TITLE: "No hay categorías disponibles",
    EMPTY_CATEGORIES_SUBTITLE: "Vuelve a intentarlo más tarde.",
  },
  CATEGORIES_PANEL: {
    TITLE: "Categorías",
    LOAD_CATEGORIES_ERROR_MESSAGE: "No se pudieron cargar las categorías.",
    LOADING_CATEGORIES_MESSAGE: "Cargando categorías...",
    RETRY_BUTTON_LABEL: "Reintentar",
    EMPTY_CATEGORIES_MESSAGE: "No hay categorías disponibles.",
  },
  PRODUCT_CARD: {
    NO_IMAGE_LABEL: "Sin imagen",
    ADD_LABEL: "Añadir",
    ADDING_LABEL: "Añadiendo",
  },
  SHOPPING_LIST: {
    DEFAULT_LIST_TITLE: "Tu lista",
    EMPTY_LIST_TITLE: "Tu lista está en modo zen 🧘‍♂️",
    EMPTY_LIST_SUBTITLE: "Añade algo del catálogo y empezamos a llenar la cesta.",
    LIST_NAME_LABEL: "Nombre de la lista",
    LIST_NAME_PLACEHOLDER: "Ej. Compra semanal",
    CANCEL_LABEL: "Cancelar",
    SAVE_LABEL: "Guardar",
  },
  LIST_MODAL: {
    DEFAULT_LIST_TITLE: "Tu lista",
    CLOSE_LABEL: "Cerrar",
    CLOSE_MODAL_LABEL: "Cerrar modal",
  },
  ITEM_LIST: {
    PRICE_UNAVAILABLE_MESSAGE: "Precio no disponible",
    DECREASE_QUANTITY_LABEL: "Disminuir cantidad de",
    INCREASE_QUANTITY_LABEL: "Incrementar cantidad de",
    REMOVE_ITEM_LABEL: "Eliminar",
  },
  TOTAL: {
    TOTAL_LABEL: "Total",
    SAVE_LIST_LABEL: "Guardar lista",
    ADD_MORE_PRODUCTS_LABEL: "Añadir más productos",
  },
  TOAST: {
    NO_IMAGE_LABEL: "Sin imagen",
    CLOSE_NOTIFICATION_LABEL: "Cerrar notificación",
  },
} as const;
