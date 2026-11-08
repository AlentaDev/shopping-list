import { describe, expect, it } from "vitest";
import { plainTextFromProviderHtml } from "./plainTextFromProviderHtml";

describe("plainTextFromProviderHtml", () => {
  it("keeps provider text while removing markup and normalizing block spacing", () => {
    expect(
      plainTextFromProviderHtml(
        "<p>Ingredientes:&nbsp;<strong>leche</strong>, harina</p><ul><li>Trigo</li><li>Huevo</li></ul>",
      ),
    ).toBe("Ingredientes: leche, harina Trigo Huevo");
  });

  it("decodes supported and numeric entities and safely replaces unknown or invalid entities", () => {
    expect(
      plainTextFromProviderHtml("&amp; &apos; &gt; &lt; &nbsp; &quot; &#65; &#x1F34E; &unknown; &#0; &#x110000;"),
    ).toBe("& ' > < \" A 🍎");
  });

  it("does not expose executable markup or its contents", () => {
    expect(
      plainTextFromProviderHtml(
        "Fruta<img src=x onerror=alert(1)><script>alert('xss')</script><STYLE>secret</STYLE> fresca",
      ),
    ).toBe("Fruta fresca");
  });

  it("handles malformed tags and entity-like text without losing ordinary content", () => {
    expect(plainTextFromProviderHtml("A & B &; C &not-an-entity D < E <b F")).toBe(
      "A & B &; C &not-an-entity D < E <b F",
    );
    expect(plainTextFromProviderHtml("antes<script>secreto sin cierre")).toBe("antes");
    expect(plainTextFromProviderHtml("antes<style>secreto</style sin cierre")).toBe("antes");
  });

  it("normalizes whitespace without adding spaces before punctuation", () => {
    expect(plainTextFromProviderHtml("  Una\n  manzana ,   roja !  ")).toBe("Una manzana, roja!");
  });
});
