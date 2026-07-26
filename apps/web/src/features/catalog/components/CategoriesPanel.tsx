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

type CategoryTreeNode = {
  category: CatalogCategoryNode;
  children: CategoryTreeNode[];
};

type CategoryNodeItemProps = {
  node: CategoryTreeNode;
  selectedCategoryId: string | null;
  ancestorIds: Set<string>;
  isMobile: boolean;
  expandedMobileIds: Set<string>;
  toggleMobileExpanded: (id: string) => void;
  onSelectCategory: (id: string) => void;
  isRoot?: boolean;
};

const LOAD_ERROR_MESSAGE =
  UI_TEXT.CATEGORIES_PANEL.LOAD_CATEGORIES_ERROR_MESSAGE;

const CATEGORIES_SKELETON_ROWS = 14;

function buildTree(categories: CatalogCategoryNode[]): CategoryTreeNode[] {
  const nodes = new Map<string, CategoryTreeNode>();

  for (const category of categories) {
    nodes.set(category.id, { category, children: [] });
  }

  const roots: CategoryTreeNode[] = [];

  for (const category of categories) {
    const node = nodes.get(category.id);
    if (!node) {
      continue;
    }

    if (category.parentId) {
      const parent = nodes.get(category.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  for (const node of nodes.values()) {
    node.children.sort((a, b) => a.category.order - b.category.order);
  }

  roots.sort((a, b) => a.category.order - b.category.order);

  return roots;
}

function findFirstLeaf(node: CategoryTreeNode): CategoryTreeNode {
  if (node.children.length === 0) {
    return node;
  }

  return findFirstLeaf(node.children[0]);
}

function getAncestorIds(
  categories: CatalogCategoryNode[],
  selectedCategoryId: string | null,
): Set<string> {
  const parentById = new Map<string, string>();

  for (const category of categories) {
    if (category.parentId) {
      parentById.set(category.id, category.parentId);
    }
  }

  const ancestorIds = new Set<string>();
  let currentId = selectedCategoryId;

  while (currentId && parentById.has(currentId)) {
    const parentId = parentById.get(currentId);
    if (!parentId) {
      break;
    }

    ancestorIds.add(parentId);
    currentId = parentId;
  }

  return ancestorIds;
}

const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
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
);

const ChevronPlaceholder = () => (
  <span
    aria-hidden="true"
    data-testid="category-chevron-placeholder"
    className="invisible h-4 w-4"
  />
);

const CategoryNodeItem = memo(function CategoryNodeItem({
  node,
  selectedCategoryId,
  ancestorIds,
  isMobile,
  expandedMobileIds,
  toggleMobileExpanded,
  onSelectCategory,
  isRoot = false,
}: CategoryNodeItemProps) {
  const hasChildren = node.children.length > 0;
  const isActive = node.category.id === selectedCategoryId;
  const isOnActivePath = ancestorIds.has(node.category.id);
  const isExpanded =
    isOnActivePath || (isMobile && expandedMobileIds.has(node.category.id));

  const handleClick = () => {
    if (isMobile) {
      if (!hasChildren) {
        onSelectCategory(node.category.id);
        return;
      }

      toggleMobileExpanded(node.category.id);
      return;
    }

    if (hasChildren) {
      const firstLeaf = findFirstLeaf(node);
      onSelectCategory(firstLeaf.category.id);
      return;
    }

    onSelectCategory(node.category.id);
  };

  if (!hasChildren) {
    if (isRoot) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={handleClick}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold transition ${
              isActive
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-900 hover:bg-slate-50"
            }`}
          >
            <ChevronPlaceholder />
            <span className="truncate">{node.category.name}</span>
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
          isActive
            ? "bg-emerald-50 text-emerald-700"
            : "text-slate-700 hover:bg-slate-50"
        }`}
      >
        {node.category.name}
      </button>
    );
  }

  if (isRoot) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={handleClick}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-900"
        >
          <ChevronIcon isExpanded={isExpanded} />
          <span className="truncate">{node.category.name}</span>
        </button>
        {isExpanded ? (
          <div className="space-y-1 border-t border-slate-100 px-3 py-2">
            {node.children.map((child) => (
              <CategoryNodeItem
                key={child.category.id}
                node={child}
                selectedCategoryId={selectedCategoryId}
                ancestorIds={ancestorIds}
                isMobile={isMobile}
                expandedMobileIds={expandedMobileIds}
                toggleMobileExpanded={toggleMobileExpanded}
                onSelectCategory={onSelectCategory}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
      >
        <ChevronIcon isExpanded={isExpanded} />
        <span className="truncate">{node.category.name}</span>
      </button>
      {isExpanded ? (
        <div className="space-y-1 pl-3">
          {node.children.map((child) => (
            <CategoryNodeItem
              key={child.category.id}
              node={child}
              selectedCategoryId={selectedCategoryId}
              ancestorIds={ancestorIds}
              isMobile={isMobile}
              expandedMobileIds={expandedMobileIds}
              toggleMobileExpanded={toggleMobileExpanded}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
});

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
  const [expandedMobileIds, setExpandedMobileIds] = useState<Set<string>>(
    () => new Set(),
  );

  const ancestorIds = useMemo(
    () => getAncestorIds(categories, selectedCategoryId),
    [categories, selectedCategoryId],
  );

  const rootNodes = useMemo(() => buildTree(categories), [categories]);

  const toggleMobileExpanded = (id: string) => {
    setExpandedMobileIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!open) {
    return null;
  }

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
        <div
          className="flex-1 overflow-y-auto p-4"
          data-testid="categories-panel-scroll"
        >
          {loadingCategories ? (
            <div
              className="min-h-full space-y-3"
              aria-live="polite"
              aria-busy="true"
            >
              {Array.from({ length: CATEGORIES_SKELETON_ROWS }).map(
                (_, index) => (
                  <div
                    key={`categories-loading-skeleton-${index}`}
                    data-testid="categories-loading-skeleton-item"
                    className="h-10 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                  />
                ),
              )}
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
              {rootNodes.map((root) => (
                <CategoryNodeItem
                  key={root.category.id}
                  node={root}
                  selectedCategoryId={selectedCategoryId}
                  ancestorIds={ancestorIds}
                  isMobile={isMobile}
                  expandedMobileIds={expandedMobileIds}
                  toggleMobileExpanded={toggleMobileExpanded}
                  onSelectCategory={onSelectCategory}
                  isRoot
                />
              ))}
            </div>
          ) : null}
          {!loadingCategories && !errorCategories && rootNodes.length === 0 ? (
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
