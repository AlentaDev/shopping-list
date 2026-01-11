import { useMemo } from "react";
import type { CatalogCategoryNode } from "../services/types";
import { UI_TEXT } from "../../../shared/constants/ui";

type CategoriesPanelProps = {
  open: boolean;
  categories: CatalogCategoryNode[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  loadingCategories?: boolean;
  errorCategories?: string | null;
  onRetryLoadCategories?: () => void;
};

const LOAD_ERROR_MESSAGE = UI_TEXT.CATEGORIES_PANEL.LOAD_CATEGORIES_ERROR_MESSAGE;

const CategoriesPanel = ({
  open,
  categories,
  selectedCategoryId,
  onSelectCategory,
  loadingCategories = false,
  errorCategories = null,
  onRetryLoadCategories,
}: CategoriesPanelProps) => {
  const parents = useMemo(
    () => categories.filter((category) => category.level === 0),
    [categories]
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string, CatalogCategoryNode[]>();
    categories
      .filter((category) => category.level === 1 && category.parentId)
      .forEach((child) => {
        const list = map.get(child.parentId!) ?? [];
        list.push(child);
        map.set(child.parentId!, list);
      });

    map.forEach((list, key) => {
      map.set(
        key,
        [...list].sort((a, b) => a.order - b.order)
      );
    });

    return map;
  }, [categories]);

  const expandedParentId = useMemo(() => {
    if (!selectedCategoryId) {
      return null;
    }

    const selectedCategory = categories.find(
      (category) => category.id === selectedCategoryId
    );

    return selectedCategory?.parentId ?? null;
  }, [categories, selectedCategoryId]);

  if (!open) {
    return null;
  }

  return (
    <aside className="w-full">
      <div className="flex max-h-[calc(100vh-144px)] flex-col rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {UI_TEXT.CATEGORIES_PANEL.TITLE}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loadingCategories ? (
            <p className="text-sm text-slate-500">
              {UI_TEXT.CATEGORIES_PANEL.LOADING_CATEGORIES_MESSAGE}
            </p>
          ) : null}
          {errorCategories ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                {errorCategories ?? LOAD_ERROR_MESSAGE}
              </p>
              {onRetryLoadCategories ? (
                <button
                  type="button"
                  onClick={onRetryLoadCategories}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
                >
                  {UI_TEXT.CATEGORIES_PANEL.RETRY_BUTTON_LABEL}
                </button>
              ) : null}
            </div>
          ) : null}
          {!loadingCategories && !errorCategories ? (
            <div className="space-y-3">
              {parents
                .sort((a, b) => a.order - b.order)
                .map((parent) => {
                  const children = childrenByParent.get(parent.id) ?? [];
                  const isExpanded = expandedParentId === parent.id;

                  return (
                    <div
                      key={parent.id}
                      className="rounded-xl border border-slate-200 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const firstChild = children[0];
                          if (firstChild) {
                            onSelectCategory(firstChild.id);
                          }
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-900"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className={`h-4 w-4 text-slate-500 transition-transform ${
                            isExpanded ? "rotate-90" : "rotate-0"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="9 6 15 12 9 18" />
                        </svg>
                        <span className="truncate">{parent.name}</span>
                      </button>

                      {isExpanded && children.length > 0 ? (
                        <div className="space-y-1 border-t border-slate-100 px-3 py-2">
                          {children.map((child) => {
                            const isActive = child.id === selectedCategoryId;
                            return (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => onSelectCategory(child.id)}
                                className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                                  isActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {child.name}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          ) : null}
          {!loadingCategories && !errorCategories && parents.length === 0 ? (
            <p className="text-sm text-slate-500">
              {UI_TEXT.CATEGORIES_PANEL.EMPTY_CATEGORIES_MESSAGE}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
};

export default CategoriesPanel;
