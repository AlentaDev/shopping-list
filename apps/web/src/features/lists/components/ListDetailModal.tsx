import { useEffect, useRef } from "react";
import { UI_TEXT } from "@src/shared/constants/ui";
import { formatPrice } from "@src/shared/utils/formatPrice";
import { adaptListDetailItemsToCategoryGroups } from "../services/adapters/ListDetailGroupingAdapter";
import type { ListActionKey } from "../services/listActions";
import type { ListDetail, ListSummary } from "../services/types";

type ListDetailModalProps = {
  actionLoading: { listId: string; action: ListActionKey } | null;
  detailActions: ListActionKey[];
  onAction: (list: ListSummary, action: ListActionKey) => void;
  onClose: () => void;
  selectedList: ListSummary;
  selectedListDetail: ListDetail;
};

type ListActionButtonProps = {
  action: ListActionKey;
  label: string;
  isDisabled: boolean;
  onClick: () => void;
};

const ACTION_LABELS: Record<ListActionKey, string> = {
  edit: UI_TEXT.LISTS.ACTIONS.EDIT,
  activate: UI_TEXT.LISTS.ACTIONS.ACTIVATE,
  complete: UI_TEXT.LISTS.ACTIONS.COMPLETE,
  reuse: UI_TEXT.LISTS.ACTIONS.REUSE,
  delete: UI_TEXT.LISTS.ACTIONS.DELETE,
  view: UI_TEXT.LISTS.ACTIONS.VIEW,
};

const ListActionButton = ({
  action,
  label,
  isDisabled,
  onClick,
}: ListActionButtonProps) => {
  let buttonStyle =
    "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900";

  if (isDisabled) {
    buttonStyle = "cursor-not-allowed border-slate-200 text-slate-300";
  } else if (action === "delete") {
    buttonStyle =
      "border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${buttonStyle}`}
    >
      {label}
    </button>
  );
};

export const ListDetailModal = ({
  actionLoading,
  detailActions,
  onAction,
  onClose,
  selectedList,
  selectedListDetail,
}: ListDetailModalProps) => {
  const previousOverflow = useRef<string | null>(null);
  const detailTotal = (selectedListDetail.items ?? []).reduce(
    (total, item) => total + (item.price ?? 0) * item.qty,
    0,
  );

  const handleDismissModal = () => {
    onClose();
  };

  useEffect(() => {
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      if (document.body.style.overflow === "hidden") {
        document.body.style.overflow = previousOverflow.current ?? "";
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismissModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

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
          aria-labelledby="list-detail-modal-title"
          className="pointer-events-auto w-full max-w-lg rounded-2xl bg-white shadow-xl"
        >
          <div className="border-b border-slate-200 px-6 py-4">
            <h2
              id="list-detail-modal-title"
              className="text-xl font-semibold text-slate-900"
            >
              {selectedListDetail.title}
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="max-h-[55vh] overflow-auto pr-1">
              <div className="space-y-5">
                {adaptListDetailItemsToCategoryGroups(selectedListDetail.items).map((group) => (
                  <section key={group.category} aria-label={group.category}>
                    <h3 className="mb-2 text-sm font-semibold text-slate-700">
                      {group.category}
                    </h3>
                    <ul className="space-y-4">
                      {group.items.map((item) => (
                        <li
                          key={item.id}
                          data-testid={`list-detail-item-${item.id}`}
                          className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                        >
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.name}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div
                              className="h-12 w-12 rounded-xl bg-slate-100"
                              aria-hidden="true"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {item.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {UI_TEXT.LISTS.CARD.ITEM_COUNT_LABEL} {item.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">
                            {formatPrice((item.price ?? 0) * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="text-right text-2xl font-semibold text-slate-900">
                {UI_TEXT.TOTAL.TOTAL_LABEL}: {formatPrice(detailTotal)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-6 py-4">
            {detailActions.map((action) => {
              const isLoadingAction =
                actionLoading?.listId === selectedList.id &&
                actionLoading.action === action;

              return (
                <ListActionButton
                  key={action}
                  action={action}
                  label={
                    isLoadingAction
                      ? UI_TEXT.LISTS.ACTIONS_LOADING[action]
                      : ACTION_LABELS[action]
                  }
                  isDisabled={actionLoading?.listId === selectedList.id}
                  onClick={() => onAction(selectedList, action)}
                />
              );
            })}
            <button
              type="button"
              onClick={handleDismissModal}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              {UI_TEXT.LISTS.DETAIL_MODAL.CLOSE_LABEL}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
