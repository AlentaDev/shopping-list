import { describe, expect, it } from "vitest";
import { mapHttpErrorToDomainError } from "./httpErrorMapper";

describe("mapHttpErrorToDomainError", () => {
  it("normaliza 401 terminal como error de auth visible", async () => {
    const response = new Response(JSON.stringify({ error: "not_authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });

    const result = await mapHttpErrorToDomainError({
      response,
      fallbackCode: "unknown_error",
    });

    expect(result).toMatchObject({
      code: "not_authenticated",
      category: "auth_terminal",
      userVisible: true,
      status: 401,
    });
  });

  it("normaliza errores 4xx de negocio/validación como visibles", async () => {
    const response = new Response(JSON.stringify({ error: "duplicate_email" }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });

    const result = await mapHttpErrorToDomainError({
      response,
      fallbackCode: "unknown_error",
    });

    expect(result).toMatchObject({
      code: "duplicate_email",
      category: "validation_business",
      userVisible: true,
      status: 409,
    });
  });

  it("normaliza error de red/offline como visible", async () => {
    const result = await mapHttpErrorToDomainError({
      error: new TypeError("Failed to fetch"),
      fallbackCode: "unknown_error",
    });

    expect(result).toMatchObject({
      code: "network_error",
      category: "network_offline",
      userVisible: true,
    });
  });
});
