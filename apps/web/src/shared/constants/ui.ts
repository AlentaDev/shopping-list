/**
 * UI Text Strings - Centralized UI messages
 * Extracted to avoid duplicated strings throughout the application
 */
/* eslint-disable sonarjs/no-hardcoded-passwords */
const DELETE_CONFIRM_LABEL = "Sí, eliminar";
const DELETE_LIST_TITLE = "¿Eliminar lista?";
const DELETE_LIST_MESSAGE = "Vas a borrar la lista";
const DRAFT_LOSS_TITLE = "¿Cambiar de lista?";
const DRAFT_LOSS_MESSAGE =
  "El borrador actual se perderá si continúas con esta acción.";

export const UI_TEXT = {
  APP: {
    TITLE: "La lista de la compra",
    CART_BUTTON_LABEL: "Abrir carrito",
    CATEGORIES_LABEL: "Categorías",
    LOGIN_LABEL: "Login",
    REGISTER_LABEL: "Registro",
  },
  AUTH: {
    BACK_TO_HOME: "Volver al catálogo",
    ERROR_MESSAGE: "No se pudo completar la autenticación.",
    ERRORS: {
      DUPLICATE_EMAIL: "Este email ya está registrado.",
      INVALID_CREDENTIALS: "Email o contraseña incorrectos.",
      VALIDATION_ERROR: "Revisa los datos e inténtalo de nuevo.",
      NOT_AUTHENTICATED: "Necesitas iniciar sesión para continuar.",
      SERVER_ERROR: "Ha ocurrido un error en el servidor. Inténtalo más tarde.",
    },
    ALREADY_LOGGED_IN: {
      TITLE: "Ya estás logueado",
      LOGIN_MESSAGE: "Ya estás logueado. No necesitas iniciar sesión de nuevo.",
      REGISTER_MESSAGE: "Ya estás logueado. No necesitas registrarte de nuevo.",
      AUTO_REDIRECT_MESSAGE: "Te llevaremos al inicio en 15 segundos.",
      BACK_HOME_LABEL: "Ir al inicio",
    },
    USER_MENU: {
      GREETING_PREFIX: "Hola",
      MENU_BUTTON_LABEL: "Abrir menú de usuario",
      PROFILE: "Perfil",
      LISTS: "Listas",
      LOGOUT: "Logout",
    },
    HINTS: {
      PASSWORD: "12–20 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo",
    },
    VALIDATION: {
      EMAIL_REQUIRED: "El email es obligatorio.",
      EMAIL_INVALID: "Introduce un email válido.",
      PASSWORD_REQUIRED: "La contraseña es obligatoria.",
      PASSWORD_LENGTH: "La contraseña debe tener entre 12 y 20 caracteres.",
      PASSWORD_COMPLEXITY:
        "La contraseña debe incluir mayúscula, minúscula, número y símbolo.",
      NAME_REQUIRED: "El nombre es obligatorio.",
      NAME_LENGTH: "El nombre debe tener entre 2 y 25 caracteres.",
      POSTAL_CODE_INVALID: "El código postal debe tener 5 dígitos.",
    },
    LOGIN: {
      TITLE: "Iniciar sesión",
      SUBTITLE: "Accede para gestionar tu lista",
      EMAIL_LABEL: "Email",
      EMAIL_PLACEHOLDER: "tu@email.com",
      PASSWORD_LABEL: "Contraseña",
      PASSWORD_PLACEHOLDER: "Tu contraseña",
      SUBMIT_LABEL: "Entrar",
    },
    REGISTER: {
      TITLE: "Crear cuenta",
      SUBTITLE: "Empieza a organizar tu compra",
      WELCOME_MESSAGE: "¡Gracias {name} por registrarte en Lista de Compra!",
      NAME_LABEL: "Nombre",
      NAME_PLACEHOLDER: "Tu nombre",
      EMAIL_LABEL: "Email",
      EMAIL_PLACEHOLDER: "tu@email.com",
      PASSWORD_LABEL: "Contraseña",
      PASSWORD_PLACEHOLDER: "Crea una contraseña segura",
      POSTAL_CODE_LABEL: "Código postal (opcional)",
      POSTAL_CODE_PLACEHOLDER: "Ej. 28001",
      SUBMIT_LABEL: "Registrarme",
    },
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
    DELETE_CONFIRMATION: {
      TITLE: "¿Eliminar producto de la lista?",
      MESSAGE: "Vas a quitar el producto",
      CANCEL_LABEL: "Cancelar",
      CONFIRM_LABEL: DELETE_CONFIRM_LABEL,
    },
    TOAST_REMOVED_MESSAGE: "Eliminado de la lista",
    AUTOSAVE_RECOVERY: {
      TITLE: "Hemos encontrado un borrador guardado",
      MESSAGE: "Puedes continuar donde lo dejaste o descartarlo.",
      CONTINUE_LABEL: "Continuar",
      DISCARD_LABEL: "Descartar",
      RESTORED_TOAST_MESSAGE: "Borrador remoto restaurado",
    },
    AUTOSAVE_CONFLICT: {
      TITLE: "¿Con cuál borrador te quedas?",
      MESSAGE:
        "Detectamos cambios distintos en el mismo momento. Elige qué versión mantener.",
      KEEP_LOCAL_LABEL: "Mantener local",
      KEEP_REMOTE_LABEL: "Mantener remoto",
    },
    DETAIL_ACTIONS: {
      EDIT: "Editar",
      CLOSE: "Cerrar",
      DELETE: "Borrar",
      REUSE: "Reusar",
    },
    DETAIL_ACTIONS_LOADING: {
      EDIT: "Editando...",
      REUSE: "Reusando...",
      DELETE: "Borrando...",
    },
    DELETE_LIST_CONFIRMATION: {
      TITLE: DELETE_LIST_TITLE,
      MESSAGE: DELETE_LIST_MESSAGE,
      CANCEL_LABEL: "Cancelar",
      CONFIRM_LABEL: DELETE_CONFIRM_LABEL,
    },
  },
  LIST_MODAL: {
    DEFAULT_LIST_TITLE: "Tu lista",
    CLOSE_LABEL: "Cerrar",
    CLOSE_MODAL_LABEL: "Cerrar modal",
    SAVE_DRAFT_LABEL: "Guardar borrador",
    READY_TO_SHOP_LABEL: "Finalizar lista",
    READY_TO_SHOP_EMPTY_MESSAGE: "Añade al menos un producto para finalizar.",
  },
  LISTS: {
    TITLE: "Mis listas",
    TABS: {
      ACTIVE: "Activas",
      COMPLETED: "Historial",
    },
    ACTIONS: {
      EDIT: "Editar",
      ACTIVATE: "Finalizar lista",
      COMPLETE: "Completar compra",
      REUSE: "Reusar",
      DELETE: "Borrar",
      VIEW: "Ver",
    },
    ACTIONS_LOADING: {
      edit: "Editando...",
      activate: "Activando...",
      complete: "Completando...",
      reuse: "Reusando...",
      delete: "Borrando...",
      view: "Cargando...",
    },
    CARD: {
      ITEM_COUNT_LABEL: "Productos:",
      ACTIVATED_AT_LABEL: "Activada:",
      UPDATED_AT_LABEL: "Actualizada:",
    },
    EMPTY_STATE: {
      ACTIVE_TITLE: "No hay listas activas",
      COMPLETED_TITLE: "Aún no hay compras completadas",
    },
    DELETE_CONFIRMATION: {
      TITLE: DELETE_LIST_TITLE,
      MESSAGE: DELETE_LIST_MESSAGE,
      CANCEL_LABEL: "Cancelar",
      CONFIRM_LABEL: DELETE_CONFIRM_LABEL,
    },
    DRAFT_LOSS: {
      TITLE: DRAFT_LOSS_TITLE,
      MESSAGE: DRAFT_LOSS_MESSAGE,
      CANCEL_LABEL: "Cancelar",
      CONFIRM_LABEL: "Continuar",
    },
    ACTIVATE_DISABLED_MESSAGE: "Añade productos para poder finalizarla.",
    AUTOSAVE_RECOVERY: {
      TITLE: "Hemos recuperado un borrador sin guardar",
      MESSAGE: "Puedes continuar o descartarlo si ya no lo necesitas.",
      CONTINUE_LABEL: "Continuar",
      DISCARD_LABEL: "Descartar",
    },
    UPDATED_AT_LABEL: "Actualizado",
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
