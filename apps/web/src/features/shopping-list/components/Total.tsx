import { formatPrice } from "@src/shared/utils/formatPrice";
import { UI_TEXT } from "@src/shared/constants/ui";

type TotalProps = {
  total: number;
  onAddMore: () => void;
  onSave: () => void;
};

const Total = ({ total, onAddMore, onSave }: TotalProps) => (
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
      onClick={onSave}
      className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
    >
      {UI_TEXT.TOTAL.SAVE_LIST_LABEL}
    </button>
    <button
      type="button"
      onClick={onAddMore}
      className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
    >
      {UI_TEXT.TOTAL.ADD_MORE_PRODUCTS_LABEL}
    </button>
  </div>
);

export default Total;
