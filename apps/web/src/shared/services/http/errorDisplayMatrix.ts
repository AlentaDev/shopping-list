export const ERROR_DISPLAY_MATRIX = {
  terminalAuthFailure: {
    userVisible: true,
    reason: "auth refresh agotado o 401 terminal",
  },
  apiValidationOrBusiness: {
    userVisible: true,
    reason: "error de validación o negocio devuelto por API",
  },
  networkOrOffline: {
    userVisible: true,
    reason: "fallo de red o cliente sin conectividad",
  },
  intermediateAuth401Recovered: {
    userVisible: false,
    reason: "401 intermedio recuperado por refresh+retry",
  },
} as const;

export type ErrorDisplayMatrixKey = keyof typeof ERROR_DISPLAY_MATRIX;
