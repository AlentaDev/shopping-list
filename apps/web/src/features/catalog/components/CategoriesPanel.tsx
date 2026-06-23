import { memo, useMemo, useState } from "react";
import type { CatalogCategoryNode } from "@src/features/catalog/services/types";
import { UI_TEXT } from "@src/shared/constants/ui";

type CategoriesPanelProps = {
  open: boolean;
  isMobile?: boolean;
  onClose?: () => void;
  categories: CatalogCategoryNode[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  loadingCategories?: boolean;
  errorCategories?: string | null;
  onRetryLoadCategories?: () => void;
};

const LOAD_ERROR_MESSAGE =
  UI_TEXT.CATEGORIES_PANEL.LOAD_CATEGORIES_ERROR_MESSAGE;

const CATEGORIES_SKELETON_ROWS = 14;

const CategoriesPanel = ({
  open,
  isMobile = false,
  onClose,
  categories,
  selectedCategoryId,
  onSelectCategory,
  loadingCategories = false,
  errorCategories = null,
  onRetryLoadCategories,
}: CategoriesPanelProps) => {
  const [mobileExpandedParentId, setMobileExpandedParentId] = useState<
    string | null
  >(null);
  const parents = useMemo(
    () =>
      categories
        .filter((category) => category.level === 0)
        .sort((a, b) => a.order - b.order),
    [categories],
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
        [...list].sort((a, b) => a.order - b.order),
      );
    });

    return map;
  }, [categories]);

  const expandedParentId = useMemo(() => {
    if (isMobile) {
      return mobileExpandedParentId;
    }

    if (!selectedCategoryId) {
      return null;
    }

    const selectedCategory = categories.find(
      (category) => category.id === selectedCategoryId,
    );

    return selectedCategory?.parentId ?? null;
  }, [categories, isMobile, mobileExpandedParentId, selectedCategoryId]);

  if (!open) {
    return null;
  }

  const selectParentCategory = (parentId: string, hasChildren: boolean) => {
    if (hasChildren) {
      return false;
    }

    onSelectCategory(parentId);
    return true;
  };

  return (
    <aside className="w-full">
      <div
        data-testid="categories-panel-shell"
        className="flex h-[calc(100vh-144px)] max-h-[calc(100vh-144px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-3">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label={UI_TEXT.CATEGORIES_PANEL.CLOSE_BUTTON_LABEL}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-emerald-800"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            ) : null}
            <h2 className="text-sm font-semibold text-slate-900">
              {UI_TEXT.CATEGORIES_PANEL.TITLE}
            </h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4" data-testid="categories-panel-scroll">
          {loadingCategories ? (
            <div className="min-h-full space-y-3" aria-live="polite" aria-busy="true">
              {Array.from({ length: CATEGORIES_SKELETON_ROWS }).map((_, index) => (
                <div
                  key={`categories-loading-skeleton-${index}`}
                  data-testid="categories-loading-skeleton-item"
                  className="h-10 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
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
              {parents.map((parent) => {
                  const children = childrenByParent.get(parent.id) ?? [];
                  const hasChildren = children.length > 0;
                  const isExpanded = expandedParentId === parent.id;

                  return (
                    <div
                      key={parent.id}
                      className="rounded-xl border border-slate-200 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isMobile) {
                            if (selectParentCategory(parent.id, hasChildren)) {
                              return;
                            }

                            setMobileExpandedParentId((currentParentId) =>
                              currentParentId === parent.id ? null : parent.id,
                            );
                            return;
                          }

                          const firstChild = children[0];
                          if (firstChild) {
                            onSelectCategory(firstChild.id);
                            return;
                          }

                          onSelectCategory(parent.id);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-900"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className={`h-4 w-4 text-slate-500 transition-transform ${
                            hasChildren ? "opacity-100" : "opacity-0"
                          } ${
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

export default memo(CategoriesPanel);
