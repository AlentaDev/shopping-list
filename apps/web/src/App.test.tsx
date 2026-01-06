import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App";

describe("App", () => {
  it("renders the shopping list header and items", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("La lista de la compra");
    expect(markup).toContain("Login");
    expect(markup).toContain("Registro");
    expect(markup).toContain("Queso curado");
  });
});
