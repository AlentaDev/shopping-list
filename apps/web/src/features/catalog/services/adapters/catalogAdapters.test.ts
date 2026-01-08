import { describe, it, expect } from "vitest";
import {
  adaptCategoryDetailResponse,
  adaptRootCategoriesResponse,
} from "./catalogAdapters";

describe("catalogAdapters", () => {
  it("normalizes root categories payload", () => {
    const payload = {
      categories: [
        { id: "root-1", name: "Panadería", order: 1, level: 0 },
      ],
    };

    expect(adaptRootCategoriesResponse(payload)).toEqual(payload);
  });

  it("falls back to empty arrays when categories are missing", () => {
    expect(adaptRootCategoriesResponse({})).toEqual({ categories: [] });
  });

  it("normalizes category detail payload", () => {
    const payload = {
      id: "child-1",
      name: "Bollería",
      subcategories: [
        {
          id: "sub-1",
          name: "Dulces",
          products: [{ id: "prod-1", name: "Ensaimada", price: 1.5 }],
        },
      ],
    };

    expect(adaptCategoryDetailResponse(payload)).toEqual(payload);
  });

  it("falls back to empty subcategories when missing", () => {
    expect(
      adaptCategoryDetailResponse({ id: "child-1", name: "Bollería" })
    ).toEqual({ id: "child-1", name: "Bollería", subcategories: [] });
  });
});
