import { useMemo, useState } from "react";
import { UI_TEXT } from "@src/shared/constants/ui";
import {
  LIST_STATUS,
  getListActions,
  type ListActionKey,
  type ListStatus,
} from "../services/listActions";

type TabKey = "DRAFT" | "ACTIVE" | "COMPLETED";

export type ListSummary = {
  id: string;
  title: string;
  updatedAt: string;
  status: ListStatus;
};

type ListsScreenProps = {
  lists: ListSummary[];
};

const TAB_LABELS: Record<TabKey, string> = {
  DRAFT: UI_TEXT.LISTS.TABS.DRAFT,
  ACTIVE: UI_TEXT.LISTS.TABS.ACTIVE,
  COMPLETED: UI_TEXT.LISTS.TABS.COMPLETED,
};

const EMPTY_STATE_BY_TAB: Record<TabKey, string> = {
  DRAFT: UI_TEXT.LISTS.EMPTY_STATE.DRAFT_TITLE,
  ACTIVE: UI_TEXT.LISTS.EMPTY_STATE.ACTIVE_TITLE,
  COMPLETED: UI_TEXT.LISTS.EMPTY_STATE.COMPLETED_TITLE,
};

const ACTION_LABELS: Record<ListActionKey, string> = {
  edit: UI_TEXT.LISTS.ACTIONS.EDIT,
  activate: UI_TEXT.LISTS.ACTIONS.ACTIVATE,
  complete: UI_TEXT.LISTS.ACTIONS.COMPLETE,
  duplicate: UI_TEXT.LISTS.ACTIONS.DUPLICATE,
  delete: UI_TEXT.LISTS.ACTIONS.DELETE,
  view: UI_TEXT.LISTS.ACTIONS.VIEW,
};

const STATUS_TO_TAB: Record<ListStatus, TabKey> = {
  [LIST_STATUS.DRAFT]: "DRAFT",
  [LIST_STATUS.ACTIVE]: "ACTIVE",
  [LIST_STATUS.COMPLETED]: "COMPLETED",
};

const ListsScreen = ({ lists }: ListsScreenProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("DRAFT");

  const filteredLists = useMemo(
    () => lists.filter((list) => STATUS_TO_TAB[list.status] === activeTab),
    [lists, activeTab]
  );

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
          {activeTab === "DRAFT" ? (
            <button
              type="button"
              className="mt-4 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              {UI_TEXT.LISTS.EMPTY_STATE.DRAFT_CTA}
            </button>
          ) : null}
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
                  {UI_TEXT.LISTS.UPDATED_AT_LABEL} {list.updatedAt}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {getListActions(list.status).map((action) => (
                  <button
                    key={action}
                    type="button"
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
    </section>
  );
};

export default ListsScreen;
