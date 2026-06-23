import { getProviderLogoInfo } from "@src/shared/constants/providers";
import { UI_TEXT } from "@src/shared/constants/ui";
import { LIST_STATUS } from "@src/shared/domain/listStatus";
import {
  getListActions,
  type ListActionKey,
} from "../services/listActions";
import type { ListSummary } from "../services/types";
import { formatListCardDate } from "./formatListCardDate";

type ListCardProps = {
  list: ListSummary;
  actionLoading: { listId: string; action: ListActionKey } | null;
  onAction: (list: ListSummary, action: ListActionKey) => void;
  onOpenDetail: (list: ListSummary) => void;
};

type ListActionButtonProps = {
  action: ListActionKey;
  label: string;
  isDisabled: boolean;
  onClick: () => void;
  stopPropagation?: boolean;
};

const ACTION_LABELS: Record<ListActionKey, string> = {
  edit: UI_TEXT.LISTS.ACTIONS.EDIT,
  activate: UI_TEXT.LISTS.ACTIONS.ACTIVATE,
  complete: UI_TEXT.LISTS.ACTIONS.COMPLETE,
  reuse: UI_TEXT.LISTS.ACTIONS.REUSE,
  delete: UI_TEXT.LISTS.ACTIONS.DELETE,
  view: UI_TEXT.LISTS.ACTIONS.VIEW,
};

const TrashIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

const ListActionButton = ({
  action,
  label,
  isDisabled,
  onClick,
  stopPropagation = false,
}: ListActionButtonProps) => {
  let buttonStyle =
    "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900";

  if (isDisabled) {
    buttonStyle = "cursor-not-allowed border-slate-200 text-slate-300";
  } else if (action === "delete") {
    buttonStyle =
      "border-red-600 bg-white text-red-600 hover:border-red-700 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200";
  }

  const sizeStyle = action === "delete" ? "h-10 w-10 p-0" : "px-3 py-1.5 text-xs";
  const disabledDeleteStyle =
    isDisabled && action === "delete" ? " border-red-200 bg-white text-red-200" : "";

  return (
    <button
      type="button"
      onClick={(event) => {
        if (stopPropagation) {
          event.preventDefault();
          event.stopPropagation();
        }

        onClick();
      }}
      disabled={isDisabled}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-full border font-semibold transition ${sizeStyle} ${buttonStyle}${disabledDeleteStyle}`}
    >
      {action === "delete" ? (
        <span className="flex items-center justify-center">
          <span className="sr-only">{label}</span>
          <TrashIcon />
        </span>
      ) : (
        label
      )}
    </button>
  );
};

const ListProviderLogo = ({ list }: Pick<ListCardProps, "list">) => {
  const providerLogo = getProviderLogoInfo(list.provider?.slug ?? list.providerId);
  const fallbackLabel = list.provider?.displayName ?? list.providerId ?? "Lista";

  if (providerLogo) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center">
        <img src={providerLogo.src} alt={providerLogo.alt} className="object-contain" />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 max-w-28 shrink-0 items-center justify-center text-center text-sm font-semibold leading-tight text-slate-500">
      <span>{fallbackLabel}</span>
    </div>
  );
};

export const ListCard = ({ list, actionLoading, onAction, onOpenDetail }: ListCardProps) => {
  const isListActionLoading = actionLoading?.listId === list.id;
  const cardActions =
    list.status === LIST_STATUS.ACTIVE || list.status === LIST_STATUS.COMPLETED
      ? (["delete"] satisfies ListActionKey[])
      : getListActions(list.status);

  const canOpenDetail =
    list.status === LIST_STATUS.ACTIVE || list.status === LIST_STATUS.COMPLETED;

  const handleCardClick = () => {
    if (!canOpenDetail) {
      return;
    }

    onOpenDetail(list);
  };

  const statusDateLabel =
    list.status === LIST_STATUS.ACTIVE
      ? UI_TEXT.LISTS.CARD.ACTIVATED_AT_LABEL
      : list.status === LIST_STATUS.COMPLETED
        ? UI_TEXT.LISTS.CARD.COMPLETED_AT_LABEL
        : UI_TEXT.LISTS.UPDATED_AT_LABEL;

  const statusDateValue =
    list.status === LIST_STATUS.ACTIVE ? list.activatedAt ?? list.updatedAt : list.updatedAt;

  return (
    <div
      data-testid={`list-card-${list.id}`}
      className={`flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition sm:p-5 ${canOpenDetail ? "cursor-pointer hover:border-slate-300 hover:shadow-md" : ""}`}
      role={canOpenDetail ? "button" : undefined}
      tabIndex={canOpenDetail ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (canOpenDetail && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          handleCardClick();
        }
      }}
    >
      <ListProviderLogo list={list} />
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="truncate text-lg font-semibold text-slate-900">{list.title}</h2>
        <div className="flex flex-col gap-0.5 text-slate-900">
          <p className="text-base font-bold text-slate-900 sm:text-lg">
            {UI_TEXT.LISTS.CARD.ITEM_COUNT_LABEL} {list.itemCount}
          </p>
          <p className="text-sm font-normal text-slate-900 sm:text-base">
            {statusDateLabel} {formatListCardDate(statusDateValue)}
          </p>
        </div>
        {list.status === LIST_STATUS.DRAFT && list.itemCount === 0 ? (
          <p className="text-xs text-slate-400">{UI_TEXT.LISTS.ACTIVATE_DISABLED_MESSAGE}</p>
        ) : null}
      </div>
      <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-2 self-start sm:self-center">
        {cardActions.map((action) => {
          const isLoadingAction = isListActionLoading && actionLoading?.action === action;
          const label = isLoadingAction
            ? UI_TEXT.LISTS.ACTIONS_LOADING[action]
            : ACTION_LABELS[action];
          const isDisabled = isListActionLoading;

          return (
            <ListActionButton
              key={action}
              action={action}
              label={label}
              isDisabled={isDisabled}
              onClick={() => onAction(list, action)}
              stopPropagation={canOpenDetail}
            />
          );
        })}
      </div>
    </div>
  );
};
