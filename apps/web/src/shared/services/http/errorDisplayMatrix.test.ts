import { describe, expect, it } from "vitest";
import { ERROR_DISPLAY_MATRIX } from "./errorDisplayMatrix";

describe("ERROR_DISPLAY_MATRIX", () => {
  it("marca como visibles los errores relevantes para usuario", () => {
    expect(ERROR_DISPLAY_MATRIX.terminalAuthFailure.userVisible).toBe(true);
    expect(ERROR_DISPLAY_MATRIX.apiValidationOrBusiness.userVisible).toBe(true);
    expect(ERROR_DISPLAY_MATRIX.networkOrOffline.userVisible).toBe(true);
  });

  it("mantiene interno el 401 intermedio recuperado por refresh", () => {
    expect(ERROR_DISPLAY_MATRIX.intermediateAuth401Recovered.userVisible).toBe(
      false,
    );
  });
});
