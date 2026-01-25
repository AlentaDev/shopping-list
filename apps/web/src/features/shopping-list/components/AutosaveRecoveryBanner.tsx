import { UI_TEXT } from "@src/shared/constants/ui";

type AutosaveRecoveryBannerProps = {
  onContinue: () => void;
  onDiscard: () => void;
};

const AutosaveRecoveryBanner = ({
  onContinue,
  onDiscard,
}: AutosaveRecoveryBannerProps) => (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-slate-700">
    <p className="text-sm font-semibold text-slate-900">
      {UI_TEXT.SHOPPING_LIST.AUTOSAVE_RECOVERY.TITLE}
    </p>
    <p className="mt-1 text-sm text-slate-600">
      {UI_TEXT.SHOPPING_LIST.AUTOSAVE_RECOVERY.MESSAGE}
    </p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onContinue}
        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
      >
        {UI_TEXT.SHOPPING_LIST.AUTOSAVE_RECOVERY.CONTINUE_LABEL}
      </button>
      <button
        type="button"
        onClick={onDiscard}
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
      >
        {UI_TEXT.SHOPPING_LIST.AUTOSAVE_RECOVERY.DISCARD_LABEL}
      </button>
    </div>
  </div>
);

export default AutosaveRecoveryBanner;
