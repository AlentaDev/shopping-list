import { useEffect, useRef, useState } from "react";
import type { CatalogProductDetail, CatalogProductSummary } from "../services/types";
import { UI_TEXT } from "@src/shared/constants/ui";
import { formatPrice, formatUnitPrice } from "@src/shared/utils/formatPrice";

type ProductDetailModalProps = {
  product: CatalogProductSummary;
  detail: CatalogProductDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  triggerElement: HTMLElement | null;
};

const ProductDetailModal = ({
  product,
  detail,
  loading,
  error,
  onClose,
  onRetry,
  triggerElement,
}: ProductDetailModalProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = detail?.photos ?? [];

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [onClose, triggerElement]);

  const details = detail
    ? [
        [UI_TEXT.PRODUCT_DETAIL_MODAL.BRAND_LABEL, detail.brand],
        [UI_TEXT.PRODUCT_DETAIL_MODAL.ORIGIN_LABEL, detail.origin],
        [UI_TEXT.PRODUCT_DETAIL_MODAL.DESCRIPTION_LABEL, detail.description],
        [UI_TEXT.PRODUCT_DETAIL_MODAL.USAGE_LABEL, detail.usageInstructions],
        [UI_TEXT.PRODUCT_DETAIL_MODAL.STORAGE_LABEL, detail.storageInstructions],
        [UI_TEXT.PRODUCT_DETAIL_MODAL.INGREDIENTS_LABEL, detail.ingredients],
        [UI_TEXT.PRODUCT_DETAIL_MODAL.ALLERGENS_LABEL, detail.allergens],
      ] as const
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={UI_TEXT.PRODUCT_DETAIL_MODAL.CLOSE_LABEL}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        ref={dialogRef}
        tabIndex={-1}
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="product-detail-title" className="text-xl font-semibold text-slate-900">
            {product.name}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700"
          >
            {UI_TEXT.PRODUCT_DETAIL_MODAL.CLOSE_LABEL}
          </button>
        </header>

        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <div>
            {photos.length > 0 ? (
              <>
                <img
                  src={photos[photoIndex]}
                  alt={product.name}
                  className="aspect-square w-full rounded-xl bg-slate-100 object-contain"
                />
                {photos.length > 1 ? (
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      aria-label={UI_TEXT.PRODUCT_DETAIL_MODAL.PREVIOUS_PHOTO_LABEL}
                      disabled={photoIndex === 0}
                      onClick={() => setPhotoIndex((index) => index - 1)}
                      className="rounded-full border px-3 py-1 disabled:opacity-40"
                    >
                      ‹
                    </button>
                    <span className="text-sm text-slate-500">
                      {photoIndex + 1} / {photos.length}
                    </span>
                    <button
                      type="button"
                      aria-label={UI_TEXT.PRODUCT_DETAIL_MODAL.NEXT_PHOTO_LABEL}
                      disabled={photoIndex === photos.length - 1}
                      onClick={() => setPhotoIndex((index) => index + 1)}
                      className="rounded-full border px-3 py-1 disabled:opacity-40"
                    >
                      ›
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
                {UI_TEXT.PRODUCT_CARD.NO_IMAGE_LABEL}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-2xl font-bold text-slate-900">{formatPrice(product.price)}</p>
            {product.unitPrice != null && product.unitFormat ? (
              <p className="text-sm text-slate-600">
                {formatUnitPrice(product.unitPrice, product.unitFormat)}
              </p>
            ) : null}
            {loading ? (
              <p role="status" aria-live="polite" className="text-sm text-slate-500">
                {UI_TEXT.PRODUCT_DETAIL_MODAL.LOADING_LABEL}
              </p>
            ) : null}
            {error ? (
              <div role="alert" className="space-y-2">
                <p className="text-sm text-red-700">{UI_TEXT.PRODUCT_DETAIL_MODAL.ERROR_LABEL}</p>
                <button type="button" onClick={onRetry} className="rounded-full border px-3 py-1.5 text-sm">
                  {UI_TEXT.CATALOG.RETRY_BUTTON_LABEL}
                </button>
              </div>
            ) : null}
            {detail ? (
              <dl className="space-y-3">
                {details.map(([label, value]) =>
                  value ? (
                    <div key={label}>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                      <dd className="whitespace-pre-wrap text-sm text-slate-800">
                        {value}
                      </dd>
                    </div>
                  ) : null,
                )}
              </dl>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetailModal;
