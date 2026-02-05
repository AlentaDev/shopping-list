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
  onCreate: () => void;
  hasDraftItems?: boolean;
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
  onCreate,
  hasDraftItems = false,
}: ListsScreenProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("ACTIVE");
  const [pendingDelete, setPendingDelete] = useState<ListSummary | null>(null);
  const [pendingDraftLoss, setPendingDraftLoss] = useState<{
    list: ListSummary;
    action: "edit" | "reuse";
  } | null>(null);

  const filteredLists = useMemo(
    () => lists.filter((list) => STATUS_TO_TAB[list.status] === activeTab),
    [lists, activeTab]
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

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {UI_TEXT.LISTS.TITLE}
          </h1>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          {UI_TEXT.LISTS.NEW_LIST_LABEL}
        </button>
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

      {filteredLists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {EMPTY_STATE_BY_TAB[activeTab]}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLists.map((list) => (
            <article
              key={list.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  {list.title}
                </h2>
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
                {getListActions(list.status).map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleAction(list, action)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      action === "delete"
                        ? "border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                        : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {ACTION_LABELS[action]}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
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
