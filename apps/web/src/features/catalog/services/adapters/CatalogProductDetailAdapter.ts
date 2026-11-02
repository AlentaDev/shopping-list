import type { CatalogProductDetail } from "../types";
import { plainTextFromProviderHtml } from "./plainTextFromProviderHtml";

const normalizeProviderText = (value: string | null): string | null =>
  value == null ? null : plainTextFromProviderHtml(value);

export const adaptProductDetailResponse = (payload: unknown): CatalogProductDetail => {
  const detail = payload as CatalogProductDetail;
  return {
    ...detail,
    name: plainTextFromProviderHtml(detail.name),
    brand: normalizeProviderText(detail.brand),
    origin: normalizeProviderText(detail.origin),
    description: normalizeProviderText(detail.description),
    usageInstructions: normalizeProviderText(detail.usageInstructions),
    storageInstructions: normalizeProviderText(detail.storageInstructions),
    ingredients: normalizeProviderText(detail.ingredients),
    allergens: normalizeProviderText(detail.allergens),
  };
};
