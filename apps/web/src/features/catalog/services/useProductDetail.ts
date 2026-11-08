import { useCallback, useEffect, useState } from "react";
import { UI_TEXT } from "@src/shared/constants/ui";
import { getProductDetail } from "./CatalogService";
import type { CatalogProductDetail, CatalogProductSummary } from "./types";

type ProductDetailResult = {
  requestKey: string;
  detail: CatalogProductDetail | null;
  error: string | null;
};

type UseProductDetailResult = {
  detail: CatalogProductDetail | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  clear: () => void;
};

export const useProductDetail = (
  providerId: string,
  product: CatalogProductSummary | null,
): UseProductDetailResult => {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState<ProductDetailResult | null>(null);
  const requestKey = product ? `${providerId}:${product.id}:${retryCount}` : null;

  useEffect(() => {
    if (!product || !requestKey) return undefined;

    let isCurrentRequest = true;
    getProductDetail(providerId, product.id)
      .then((detail) => {
        if (isCurrentRequest) setResult({ requestKey, detail, error: null });
      })
      .catch(() => {
        if (isCurrentRequest) {
          setResult({
            requestKey,
            detail: null,
            error: UI_TEXT.PRODUCT_DETAIL_MODAL.ERROR_LABEL,
          });
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [product, providerId, requestKey]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);
  const clear = useCallback(() => setResult(null), []);
  const currentResult = result?.requestKey === requestKey ? result : null;

  return {
    detail: currentResult?.detail ?? null,
    loading: Boolean(product && !currentResult),
    error: currentResult?.error ?? null,
    retry,
    clear,
  };
};
