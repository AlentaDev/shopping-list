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
    TITLE: "Shopping List",
    HOME_LABEL: "Inicio",
    CART_BUTTON_LABEL: "Abrir carrito",
    MY_LISTS_LABEL: "Mis Listas",
    CATEGORIES_LABEL: "Categorías",
    DOWNLOAD_APP_LABEL: "Descargar app",
    LOGIN_LABEL: "Login",
    REGISTER_LABEL: "Registro",
    MOBILE_MENU_BUTTON_LABEL: "Abrir menú de navegación",
    MOBILE_MENU_TITLE: "Menú de navegación",
    HANDSHAKE_WAITING_BANNER:
      "Estamos preparando tu lista para que puedas seguir comprando.",
    HANDSHAKE_READY_TOAST: "Tu lista ya está lista para continuar.",
  },
  HOME: {
    HERO_TITLE: "Organiza tu compra antes de salir de casa.",
    HERO_SUBTITLE:
      "Prepara tu lista, entra en el catálogo de tu súper y llega al pasillo con todo claro.",
    PRIMARY_CTA_LABEL: "Ver supermercados disponibles",
    DOWNLOAD_APP_CTA_LABEL: "Descargar app Android",
    HERO_IMAGE_ALT: "Productos frescos preparados para tu compra semanal",
    PROVIDERS_SECTION_TITLE: "Supermercados disponibles",
    PROVIDERS_SECTION_SUBTITLE:
      "Empieza con tu proveedor habitual y crea una lista lista para usar desde tu móvil.",
    ANONYMOUS_DRAFT_GUIDANCE:
      "Tienes un borrador asociado a {provider}. Puedes seguir ahí o elegir otro catálogo antes de añadir productos.",
    PROVIDERS: {
      MERCADONA: {
        LOGO_ALT: "Logo de Mercadona",
        CTA_LABEL: "Cátalogo Mercadona",
      },
      BONPREUESCLAT: {
        LOGO_ALT: "Logo de Bonpreu Esclat",
        CTA_LABEL: "Cátalogo Bonpreu Esclat",
      },
    },
  },
  FOOTER: {
    TAGLINE: "Shopping List te ayuda a preparar la compra con menos improvisación.",
    SUPPORTING_COPY: "Elige tu súper, prepara la lista y úsala después desde la app móvil.",
    COPYRIGHT: "© Shopping List - AlentaDev 2026. Todos los derechos reservados.",
  },
  PROVIDERS: {
    MERCADONA: {
      DISPLAY_NAME: "Mercadona",
    },
    BONPREUESCLAT: {
      DISPLAY_NAME: "Bonpreu Esclat",
    },
  },
  APP_DOWNLOAD: {
    BADGE_LABEL: "Beta",
    TITLE: "Shopping List para Android",
    SUBTITLE:
      "Descarga la app beta para usar tus listas en el súper y seguir comprando aunque la conexión sea inestable.",
    DOWNLOAD_BUTTON_LABEL: "Descargar APK Android",
    VERSION_LABEL: "Versión:",
    UPDATED_AT_LABEL: "Última actualización:",
    RELEASE: {
      VERSION: "v0.10.3",
      UPDATED_AT: "15/06/2026",
      APK_URL:
        "https://github.com/AlentaDev/shopping-list/releases/download/android-v0.10.3/shopping-list-android.apk",
    },
    INSTALL_STEPS: {
      TITLE: "Cómo instalar",
      FIRST: "Descarga el APK en tu dispositivo Android.",
      SECOND: "Abre el archivo y confirma la instalación.",
      THIRD:
        "Si Android lo solicita, habilita 'Instalar apps desconocidas' para tu navegador o gestor de archivos.",
    },
    KNOWN_LIMITATIONS: {
      TITLE: "Limitaciones conocidas de esta beta",
      FIRST: "La sincronización puede requerir reintentos en conexiones inestables.",
      SECOND: "Puede haber latencia puntual al refrescar listas con mala conexión.",
      THIRD: "Soporte inicial solo para Android.",
    },
  },
  AUTH: {
    BACK_TO_HOME: "Volver al catálogo",
    ERROR_MESSAGE: "No se pudo completar la autenticación.",
    ERRORS: {
      DUPLICATE_EMAIL: "Este email ya está registrado.",
      INVALID_CREDENTIALS: "Email o contraseña incorrectos.",
      VALIDATION_ERROR: "Revisa los datos e inténtalo de nuevo.",
      NOT_AUTHENTICATED: "Necesitas iniciar sesión para continuar.",
      SESSION_EXPIRED: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
      NETWORK_ERROR: "Sin conexión. Revisa tu red e inténtalo de nuevo.",
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
      SECONDARY_PROMPT: "¿No tienes cuenta? Crea una pinchando",
      SECONDARY_ACTION: "aquí",
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
      SECONDARY_PROMPT: "¿Ya estás registrado? Logueate pinchando",
      SECONDARY_ACTION: "aquí",
    },
  },
  CATALOG: {
    TITLE: "Catálogo",
    LOAD_PRODUCTS_ERROR_MESSAGE: "No se pudieron cargar los productos.",
    LOADING_PRODUCTS_MESSAGE: "Cargando productos...",
    SWITCHING_PRODUCTS_MESSAGE: "Cargando productos de la categoría seleccionada...",
    RETRY_BUTTON_LABEL: "Reintentar",
    TOAST_ADDED_MESSAGE: "Añadido a la lista",
    EMPTY_PRODUCTS_TITLE: "No hay productos disponibles",
    EMPTY_PRODUCTS_SUBTITLE: "Prueba a seleccionar otra categoría.",
    EMPTY_CATEGORIES_TITLE: "No hay categorías disponibles",
    EMPTY_CATEGORIES_SUBTITLE: "Vuelve a intentarlo más tarde.",
    DRAFT_PROVIDER_CONFLICT:
      "Tu borrador actual pertenece a {currentProvider}. Si continúas, lo vaciaremos para empezar una nueva lista en {requestedProvider}.",
  },
  CATEGORIES_PANEL: {
    TITLE: "Categorías",
    OPEN_BUTTON_LABEL: "Abrir categorías",
    CLOSE_BUTTON_LABEL: "Cerrar categorías",
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
      TITLE: "Conflicto de sincronización detectado",
      MESSAGE:
        "Hay cambios en servidor y en tu borrador actual. Elige cómo quieres continuar.",
      UPDATE_FIRST_LABEL: "Actualizar desde servidor y reaplicar mi nuevo producto",
      KEEP_LOCAL_LABEL: "Mantener mis cambios locales y seguir con el borrador",
      PENDING_SYNC_MESSAGE:
        "Tienes cambios locales pendientes de sincronizar por conflicto de autosave.",
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
    EDITING_ACTIONS: {
      FINISH: "Finalizar edición",
      CANCEL: "Cancelar edición",
      FINISH_TOAST_MESSAGE:
        "Ya puedes usar tu lista en el móvil para hacer tu compra sin olvidarte nada.",
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
    READY_TO_SHOP_TOAST_MESSAGE:
      "Ya puedes usar tu lista en el móvil para hacer tu compra sin olvidarte nada.",
    EDIT_TITLE: {
      BUTTON_LABEL: "Editar título",
      INPUT_LABEL: "Título de la lista",
      SUBMIT_LABEL: "Guardar título",
      VALIDATION_ERROR: "El título debe tener entre 3 y 35 caracteres.",
    },
  },
  LISTS: {
    TITLE: "Mis listas",
    CATEGORY_FALLBACK: "Sin categoría",
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
      PROVIDER_LABEL: "Proveedor:",
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
    ACTIVE_EDIT_CONFLICT: {
      TITLE: "Ya estás editando otra lista",
      MESSAGE:
        "Ahora mismo estás editando una lista de {currentProvider}. Solo puedes cancelar esa edición y empezar una nueva lista en {requestedProvider}, o volver al catálogo original.",
      RETURN_LABEL: "Volver al catálogo original",
      CONFIRM_LABEL: "Cancelar edición y empezar una lista nueva",
      CANCEL_ERROR: "Unable to cancel active editing.",
    },
    ACTIVATE_DISABLED_MESSAGE: "Añade productos para poder finalizarla.",
    AUTOSAVE_RECOVERY: {
      TITLE: "Hemos recuperado un borrador sin guardar",
      MESSAGE: "Puedes continuar o descartarlo si ya no lo necesitas.",
      CONTINUE_LABEL: "Continuar",
      DISCARD_LABEL: "Descartar",
    },
    UPDATED_AT_LABEL: "Actualizado",
    DETAIL_MODAL: {
      CLOSE_LABEL: "Cerrar",
    },
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
  ERROR_BOUNDARY: {
    TITLE: "Something went wrong",
    MESSAGE: "Please refresh the page and try again.",
  },
} as const;
