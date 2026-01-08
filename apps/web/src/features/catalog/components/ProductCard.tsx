import type { CatalogProductSummary } from "../services/types";
import { formatEuro, formatUnitPrice } from "../../../shared/lib/format";

type ProductCardProps = {
  product: CatalogProductSummary;
};

const ProductCard = ({ product }: ProductCardProps) => (
  <article className="flex h-full flex-col rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
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
            Sin imagen
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-900">
          {product.name}
        </h3>
        <div className="text-base font-semibold text-slate-900">
          {formatEuro(product.price)}
        </div>
        {product.unitPrice != null && product.unitFormat ? (
          <div className="text-xs text-slate-500">
            {formatUnitPrice(product.unitPrice, product.unitFormat)}
          </div>
        ) : null}
      </div>
      <button className="mt-4 flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-600">
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
        Añadir
      </button>
    </div>
  </article>
);

export default ProductCard;
