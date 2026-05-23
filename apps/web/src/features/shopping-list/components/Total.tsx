import { formatPrice } from "@src/shared/utils/formatPrice";
import { UI_TEXT } from "@src/shared/constants/ui";

type TotalProps = {
  total: number;
  onAddMore: () => void;
  disabled?: boolean;
};

const Total = ({ total, onAddMore, disabled = false }: TotalProps) => (
  <div className="space-y-3 border-t border-slate-200 pt-4">
    <div className="flex items-center justify-between">
      <span className="text-base font-semibold text-slate-900">
        {UI_TEXT.TOTAL.TOTAL_LABEL}
      </span>
      <span
        data-testid="total-value"
        className="text-lg font-semibold text-slate-900"
      >
        {formatPrice(total)}
      </span>
    </div>
    <button
      type="button"
      onClick={onAddMore}
      disabled={disabled}
      className={`w-full rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
        disabled
          ? "cursor-not-allowed bg-emerald-300"
          : "bg-emerald-500 hover:bg-emerald-600"
      }`}
    >
      {UI_TEXT.TOTAL.ADD_MORE_PRODUCTS_LABEL}
    </button>
  </div>
);

export default Total;
