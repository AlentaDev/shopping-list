import type { ShoppingListItem } from "../types";
import { formatUnitPrice } from "../../../shared/utils/formatPrice";
import { UI_TEXT } from "../../../shared/constants/ui";

type ItemListProps = {
  items: ShoppingListItem[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
};

const ItemList = ({
  items,
  onIncrement,
  onDecrement,
  onRemove,
}: ItemListProps) => (
  <div className="max-h-[60vh] overflow-auto pr-1">
    <ul className="space-y-4">
      {items.map((item) => (
        <li
          key={item.id}
          data-testid="shopping-list-item"
          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
        >
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-slate-900"
              data-testid="item-name"
            >
              {item.name}
            </p>
            <p className="text-xs text-slate-500">
              {item.price !== null && item.price !== undefined
                ? formatUnitPrice(item.price, "unidad")
                : UI_TEXT.ITEM_LIST.PRICE_UNAVAILABLE_MESSAGE}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDecrement(item.id)}
              disabled={item.quantity === 1}
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold transition ${
                item.quantity === 1
                  ? "cursor-not-allowed border-slate-200 text-slate-300"
                  : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900"
              }`}
              aria-label={`${UI_TEXT.ITEM_LIST.DECREASE_QUANTITY_LABEL} ${item.name}`}
            >
              -
            </button>
            <span
              data-testid={`quantity-${item.id}`}
              className="w-6 text-center text-sm font-semibold text-slate-900"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrement(item.id)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              aria-label={`${UI_TEXT.ITEM_LIST.INCREASE_QUANTITY_LABEL} ${item.name}`}
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`${UI_TEXT.ITEM_LIST.REMOVE_ITEM_LABEL} ${item.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-400 transition hover:border-slate-200 hover:text-slate-600"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  </div>
);

export default ItemList;
