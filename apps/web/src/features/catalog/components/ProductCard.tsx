import { useEffect, useRef, useState } from "react";
import type { CatalogProductSummary } from "../services/types";
import { formatPrice, formatUnitPrice } from "../../../shared/utils/formatPrice";
import { UI_TEXT } from "../../../shared/constants/ui";

type ProductCardProps = {
  product: CatalogProductSummary;
  onAdd: () => void;
};

const ADDING_DELAY_MS = 500;

const ProductCard = ({ product, onAdd }: ProductCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    },
    []
  );

  const handleAdd = () => {
    if (isAdding) {
      return;
    }

    setIsAdding(true);
    onAdd();

    timerRef.current = window.setTimeout(() => {
      setIsAdding(false);
    }, ADDING_DELAY_MS);
  };

  return (
    <article
      data-testid="catalog-product-card"
      className="flex h-full flex-col rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex flex-col p-3">
        <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
              {UI_TEXT.PRODUCT_CARD.NO_IMAGE_LABEL}
            </div>
          )}
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-900">
            {product.name}
          </h3>
          <div className="text-base font-semibold text-slate-900">
            {formatPrice(product.price)}
          </div>
          {product.unitPrice != null && product.unitFormat ? (
            <div className="text-xs text-slate-500">
              {formatUnitPrice(product.unitPrice, product.unitFormat)}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdding}
          data-testid="catalog-add-button"
          aria-label={
            isAdding
              ? `${UI_TEXT.PRODUCT_CARD.ADDING_LABEL} ${product.name}`
              : `${UI_TEXT.PRODUCT_CARD.ADD_LABEL} ${product.name}`
          }
          className={`mt-4 flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition ${
            isAdding
              ? "cursor-not-allowed bg-slate-200 text-slate-500"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          {isAdding ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"
                aria-hidden="true"
              />
              {UI_TEXT.PRODUCT_CARD.ADDING_LABEL}
            </>
          ) : (
            <>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {UI_TEXT.PRODUCT_CARD.ADD_LABEL}
            </>
          )}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
