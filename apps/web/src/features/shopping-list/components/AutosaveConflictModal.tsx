import { UI_TEXT } from "@src/shared/constants/ui";

type AutosaveConflictModalProps = {
  isOpen: boolean;
  onUpdateFirst: () => void;
  onKeepLocal: () => void;
};

const AutosaveConflictModal = ({
  isOpen,
  onUpdateFirst,
  onKeepLocal,
}: AutosaveConflictModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-slate-900">
          {UI_TEXT.SHOPPING_LIST.AUTOSAVE_CONFLICT.TITLE}
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          {UI_TEXT.SHOPPING_LIST.AUTOSAVE_CONFLICT.MESSAGE}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onUpdateFirst}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            {UI_TEXT.SHOPPING_LIST.AUTOSAVE_CONFLICT.UPDATE_FIRST_LABEL}
          </button>
          <button
            type="button"
            onClick={onKeepLocal}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            {UI_TEXT.SHOPPING_LIST.AUTOSAVE_CONFLICT.KEEP_LOCAL_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutosaveConflictModal;
