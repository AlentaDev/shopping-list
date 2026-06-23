import { useMemo, useState } from "react";
import { UI_TEXT } from "@src/shared/constants/ui";
import { LIST_STATUS, type ListStatus } from "@src/shared/domain/listStatus";
import { type ListActionKey } from "../services/listActions";
import type { ListDetail, ListSummary } from "../services/types";
import { ListDetailModal } from "./ListDetailModal";
import { ListCard } from "./ListCard";

type TabKey = "ACTIVE" | "COMPLETED";

type ListsScreenProps = {
  lists: ListSummary[];
  onAction: (list: ListSummary, action: ListActionKey) => void;
  onOpenDetail: (list: ListSummary) => void;
  onCloseDetail: () => void;
  selectedList: ListSummary | null;
  selectedListDetail: ListDetail | null;
  hasDraftItems?: boolean;
  isLoading?: boolean;
  actionLoading?: { listId: string; action: ListActionKey } | null;
};


const TAB_LABELS: Record<TabKey, string> = {
  ACTIVE: UI_TEXT.LISTS.TABS.ACTIVE,
  COMPLETED: UI_TEXT.LISTS.TABS.COMPLETED,
};

const EMPTY_STATE_BY_TAB: Record<TabKey, string> = {
  ACTIVE: UI_TEXT.LISTS.EMPTY_STATE.ACTIVE_TITLE,
  COMPLETED: UI_TEXT.LISTS.EMPTY_STATE.COMPLETED_TITLE,
};
const STATUS_TO_TAB: Partial<Record<ListStatus, TabKey>> = {
  [LIST_STATUS.ACTIVE]: "ACTIVE",
  [LIST_STATUS.COMPLETED]: "COMPLETED",
};

const ListsScreen = ({
  lists,
  onAction,
  onOpenDetail,
  onCloseDetail,
  selectedList,
  selectedListDetail,
  hasDraftItems = false,
  isLoading = false,
  actionLoading = null,
}: ListsScreenProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("ACTIVE");
  const [pendingDelete, setPendingDelete] = useState<ListSummary | null>(null);
  const [pendingDraftLoss, setPendingDraftLoss] = useState<{
    list: ListSummary;
    action: "edit";
  } | null>(null);

  const filteredLists = useMemo(
    () => lists.filter((list) => STATUS_TO_TAB[list.status] === activeTab),
    [lists, activeTab],
  );

  const selectedListStatus = selectedList?.status;
  const detailActions =
    selectedListStatus === LIST_STATUS.COMPLETED
      ? (["reuse", "delete"] satisfies ListActionKey[])
      : selectedListStatus === LIST_STATUS.ACTIVE
        ? (["edit", "delete"] satisfies ListActionKey[])
        : [];

  const handleAction = (list: ListSummary, action: ListActionKey) => {
    if (action === "delete") {
      setPendingDelete(list);
      return;
    }

    if (action === "edit" && hasDraftItems) {
      setPendingDraftLoss({ list, action });
      return;
    }

    onAction(list, action);
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) {
      return;
    }

    onAction(pendingDelete, "delete");
    setPendingDelete(null);
  };

  const handleConfirmDraftLoss = () => {
    if (!pendingDraftLoss) {
      return;
    }

    onAction(pendingDraftLoss.list, pendingDraftLoss.action);
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
            onOpenDetail={onOpenDetail}
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
      {selectedList && selectedListDetail ? (
        <ListDetailModal
          actionLoading={actionLoading}
          detailActions={detailActions}
          onAction={handleAction}
          onClose={onCloseDetail}
          selectedList={selectedList}
          selectedListDetail={selectedListDetail}
        />
      ) : null}
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
