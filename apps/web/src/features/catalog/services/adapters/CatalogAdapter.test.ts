import { describe, it, expect } from "vitest";
import {
  adaptCategoryDetailResponse,
  adaptRootCategoriesResponse,
} from "./CatalogAdapter";

const productFixtures = {
  ensaimada: {
    id: "prod-1",
    name: "Ensaimada",
    thumbnail: null,
    packaging: null,
    price: 1.5,
    unitSize: null,
    unitFormat: null,
    unitPrice: null,
    isApproxSize: false,
  },
  empanada: {
    id: "prod-2",
    name: "Empanada",
    thumbnail: null,
    packaging: null,
    price: 2.1,
    unitSize: null,
    unitFormat: null,
    unitPrice: null,
    isApproxSize: false,
  },
};

describe("CatalogAdapter", () => {
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

  it("maps multiple subcategories into catalog sections", () => {
    const payload = {
      id: "child-1",
      name: "Bollería",
      subcategories: [
        {
          id: "sub-1",
          name: "Dulces",
          products: [productFixtures.ensaimada],
        },
        {
          id: "sub-2",
          name: "Salados",
          products: [productFixtures.empanada],
        },
      ],
    };

    expect(adaptCategoryDetailResponse(payload)).toEqual({
      categoryName: "Bollería",
      sections: [
        {
          subcategoryName: "Dulces",
          products: [productFixtures.ensaimada],
        },
        {
          subcategoryName: "Salados",
          products: [productFixtures.empanada],
        },
      ],
    });
  });

  it("falls back to empty sections when subcategories are missing", () => {
    expect(
      adaptCategoryDetailResponse({ id: "child-1", name: "Bollería" })
    ).toEqual({ categoryName: "Bollería", sections: [] });
  });
});
