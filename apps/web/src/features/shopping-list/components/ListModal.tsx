import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { z } from "zod";
import { UI_TEXT } from "@src/shared/constants/ui";

type ListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onReadyToShop?: () => void;
  itemCount?: number;
  isReadyToShopDisabled?: boolean;
  children: ReactNode;
  title?: string;
  onTitleSubmit?: (title: string) => void;
  footerContent?: ReactNode;
};

const TITLE_SCHEMA = z.object({
  title: z
    .string()
    .trim()
    .min(3, UI_TEXT.LIST_MODAL.EDIT_TITLE.VALIDATION_ERROR)
    .max(35, UI_TEXT.LIST_MODAL.EDIT_TITLE.VALIDATION_ERROR),
});

const ListModal = ({
  isOpen,
  onClose,
  onReadyToShop,
  itemCount,
  isReadyToShopDisabled = false,
  children,
  title,
  onTitleSubmit,
  footerContent,
}: ListModalProps) => {
  const titleId = useId();
  const previousOverflow = useRef<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

  const resetTitleEditor = () => {
    setIsEditingTitle(false);
    setTitleError(null);
    setDraftTitle(title ?? UI_TEXT.LIST_MODAL.DEFAULT_LIST_TITLE);
  };

  const handleDismissModal = () => {
    resetTitleEditor();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow.current ?? "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismissModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, title]);

  if (!isOpen) {
    return null;
  }

  const isEmptyList = itemCount === 0;
  const shouldDisableReadyToShop = isReadyToShopDisabled || isEmptyList;

  const handleStartEditingTitle = () => {
    setDraftTitle(title ?? UI_TEXT.LIST_MODAL.DEFAULT_LIST_TITLE);
    setTitleError(null);
    setIsEditingTitle(true);
  };

  const handleSubmitTitle = () => {
    const result = TITLE_SCHEMA.safeParse({ title: draftTitle });

    if (!result.success) {
      setTitleError(result.error.issues[0]?.message ?? null);
      return;
    }

    onTitleSubmit?.(result.data.title);
    setTitleError(null);
    setIsEditingTitle(false);
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        data-testid="list-modal-backdrop"
        className="fixed inset-0 bg-black/40"
        onClick={handleDismissModal}
        aria-label={UI_TEXT.LIST_MODAL.CLOSE_MODAL_LABEL}
      />
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="pointer-events-auto w-full max-w-lg rounded-2xl bg-white shadow-xl"
        >
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              {isEditingTitle ? (
                <div className="flex flex-1 items-center gap-2">
                  <label htmlFor={titleId} className="sr-only">
                    {UI_TEXT.LIST_MODAL.EDIT_TITLE.INPUT_LABEL}
                  </label>
                  <input
                    id={titleId}
                    type="text"
                    value={draftTitle}
                    onChange={(event) => {
                      setDraftTitle(event.target.value);
                      setTitleError(null);
                    }}
                    aria-label={UI_TEXT.LIST_MODAL.EDIT_TITLE.INPUT_LABEL}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleSubmitTitle}
                    aria-label={UI_TEXT.LIST_MODAL.EDIT_TITLE.SUBMIT_LABEL}
                    className="rounded-full border border-slate-300 p-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14" />
                      <path d="m13 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <h2 id={titleId} className="text-xl font-semibold text-slate-900">
                  {title ?? UI_TEXT.LIST_MODAL.DEFAULT_LIST_TITLE}
                </h2>
              )}
              {onTitleSubmit && !isEditingTitle ? (
                <button
                  type="button"
                  onClick={handleStartEditingTitle}
                  aria-label={UI_TEXT.LIST_MODAL.EDIT_TITLE.BUTTON_LABEL}
                  className="rounded-full border border-slate-300 p-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
              ) : null}
            </div>
            {titleError ? (
              <p className="mt-2 text-sm text-red-600">{titleError}</p>
            ) : null}
          </div>
          <div className="px-6 py-4">{children}</div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-6 py-4">
            {footerContent}
            {onReadyToShop ? (
              <div className="flex flex-col items-end gap-2 text-right">
                <button
                  type="button"
                  onClick={onReadyToShop}
                  disabled={shouldDisableReadyToShop}
                  className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
                    shouldDisableReadyToShop
                      ? "cursor-not-allowed bg-emerald-200"
                      : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
                >
                  {UI_TEXT.LIST_MODAL.READY_TO_SHOP_LABEL}
                </button>
                {isEmptyList ? (
                  <p className="text-xs text-slate-500">
                    {UI_TEXT.LIST_MODAL.READY_TO_SHOP_EMPTY_MESSAGE}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListModal;
