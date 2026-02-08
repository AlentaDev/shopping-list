import { useMemo, useState } from "react";
import { UI_TEXT } from "@src/shared/constants/ui";
import {
  LIST_STATUS,
  getListActions,
  type ListActionKey,
  type ListStatus,
} from "../services/listActions";
import type { ListSummary } from "../services/types";

type TabKey = "ACTIVE" | "COMPLETED";

type ListsScreenProps = {
  lists: ListSummary[];
  onAction: (listId: string, action: ListActionKey) => void;
  hasDraftItems?: boolean;
  isLoading?: boolean;
  actionLoading?: { listId: string; action: ListActionKey } | null;
};

type ListActionButtonProps = {
  action: ListActionKey;
  label: string;
  isDisabled: boolean;
  onClick: () => void;
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

type ListCardProps = {
  list: ListSummary;
  actionLoading: { listId: string; action: ListActionKey } | null;
  onAction: (list: ListSummary, action: ListActionKey) => void;
};

const ListCard = ({ list, actionLoading, onAction }: ListCardProps) => {
  const isListActionLoading = actionLoading?.listId === list.id;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">{list.title}</h2>
        <p className="text-sm text-slate-500">
          {UI_TEXT.LISTS.CARD.ITEM_COUNT_LABEL} {list.itemCount}
        </p>
        <p className="text-sm text-slate-500">
          {list.status === LIST_STATUS.ACTIVE
            ? UI_TEXT.LISTS.CARD.ACTIVATED_AT_LABEL
            : UI_TEXT.LISTS.CARD.UPDATED_AT_LABEL}{" "}
          {list.status === LIST_STATUS.ACTIVE
            ? list.activatedAt ?? list.updatedAt
            : list.updatedAt}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {getListActions(list.status).map((action) => {
          const isLoadingAction =
            isListActionLoading && actionLoading?.action === action;
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
            />
          );
        })}
      </div>
    </article>
  );
};

const TAB_LABELS: Record<TabKey, string> = {
  ACTIVE: UI_TEXT.LISTS.TABS.ACTIVE,
  COMPLETED: UI_TEXT.LISTS.TABS.COMPLETED,
};

const EMPTY_STATE_BY_TAB: Record<TabKey, string> = {
  ACTIVE: UI_TEXT.LISTS.EMPTY_STATE.ACTIVE_TITLE,
  COMPLETED: UI_TEXT.LISTS.EMPTY_STATE.COMPLETED_TITLE,
};

const ACTION_LABELS: Record<ListActionKey, string> = {
  edit: UI_TEXT.LISTS.ACTIONS.EDIT,
  activate: UI_TEXT.LISTS.ACTIONS.ACTIVATE,
  complete: UI_TEXT.LISTS.ACTIONS.COMPLETE,
  reuse: UI_TEXT.LISTS.ACTIONS.REUSE,
  delete: UI_TEXT.LISTS.ACTIONS.DELETE,
  view: UI_TEXT.LISTS.ACTIONS.VIEW,
};

const STATUS_TO_TAB: Partial<Record<ListStatus, TabKey>> = {
  [LIST_STATUS.ACTIVE]: "ACTIVE",
  [LIST_STATUS.COMPLETED]: "COMPLETED",
};

const ListsScreen = ({
  lists,
  onAction,
  hasDraftItems = false,
  isLoading = false,
  actionLoading = null,
}: ListsScreenProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("ACTIVE");
  const [pendingDelete, setPendingDelete] = useState<ListSummary | null>(null);
  const [pendingDraftLoss, setPendingDraftLoss] = useState<{
    list: ListSummary;
    action: "edit" | "reuse";
  } | null>(null);

  const filteredLists = useMemo(
    () => lists.filter((list) => STATUS_TO_TAB[list.status] === activeTab),
    [lists, activeTab],
  );

  const handleAction = (list: ListSummary, action: ListActionKey) => {
    if (action === "delete") {
      setPendingDelete(list);
      return;
    }

    if ((action === "edit" || action === "reuse") && hasDraftItems) {
      setPendingDraftLoss({ list, action });
      return;
    }

    onAction(list.id, action);
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) {
      return;
    }

    onAction(pendingDelete.id, "delete");
    setPendingDelete(null);
  };

  const handleConfirmDraftLoss = () => {
    if (!pendingDraftLoss) {
      return;
    }

    onAction(pendingDraftLoss.list.id, pendingDraftLoss.action);
    setPendingDraftLoss(null);
  };

  const renderSkeletons = () => (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`lists-skeleton-${index}`}
          data-testid="lists-skeleton-card"
          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="h-5 w-1/3 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-2/5 animate-pulse rounded-full bg-slate-100" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
          <div className="flex gap-2">
            <div className="h-7 w-16 animate-pulse rounded-full bg-slate-200" />
            <div className="h-7 w-16 animate-pulse rounded-full bg-slate-200" />
            <div className="h-7 w-16 animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderListsContent = () => {
    if (isLoading) {
      return renderSkeletons();
    }

    if (filteredLists.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {EMPTY_STATE_BY_TAB[activeTab]}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {filteredLists.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            actionLoading={actionLoading}
            onAction={handleAction}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {UI_TEXT.LISTS.TITLE}
          </h1>
        </div>
      </header>

      <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            role="tab"
            aria-selected={activeTab === tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`rounded-full px-4 py-2 font-semibold transition ${
              activeTab === tabKey
                ? "bg-emerald-500 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {TAB_LABELS[tabKey]}
          </button>
        ))}
      </div>

      {renderListsContent()}
      {pendingDelete ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {UI_TEXT.LISTS.DELETE_CONFIRMATION.TITLE}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {UI_TEXT.LISTS.DELETE_CONFIRMATION.MESSAGE}{" "}
              <span className="font-semibold text-slate-800">
                {pendingDelete.title}
              </span>
              .
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                {UI_TEXT.LISTS.DELETE_CONFIRMATION.CANCEL_LABEL}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                {UI_TEXT.LISTS.DELETE_CONFIRMATION.CONFIRM_LABEL}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {pendingDraftLoss ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {UI_TEXT.LISTS.DRAFT_LOSS.TITLE}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {UI_TEXT.LISTS.DRAFT_LOSS.MESSAGE}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingDraftLoss(null)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                {UI_TEXT.LISTS.DRAFT_LOSS.CANCEL_LABEL}
              </button>
              <button
                type="button"
                onClick={handleConfirmDraftLoss}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {UI_TEXT.LISTS.DRAFT_LOSS.CONFIRM_LABEL}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default ListsScreen;
