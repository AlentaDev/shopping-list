import { useMemo } from "react";
import type { CatalogCategoryNode } from "./types";

type CategoriesPanelProps = {
  open: boolean;
  categories: CatalogCategoryNode[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  loadingCategories?: boolean;
  errorCategories?: string | null;
  onRetryLoadCategories?: () => void;
};

const LOAD_ERROR_MESSAGE = "No se pudieron cargar las categorías.";

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

  if (!open) {
    return null;
  }

  return (
    <aside className="w-full sm:w-80">
      <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Categorías</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loadingCategories ? (
            <p className="text-sm text-slate-500">Cargando categorías...</p>
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
                  Reintentar
                </button>
              ) : null}
            </div>
          ) : null}
          {!loadingCategories && !errorCategories ? (
            <div className="space-y-4">
              {parents
                .sort((a, b) => a.order - b.order)
                .map((parent) => {
                  const children = childrenByParent.get(parent.id) ?? [];
                  const isSelectedSection = children.some(
                    (child) => child.id === selectedCategoryId
                  );

                  return (
                    <div
                      key={parent.id}
                      className="rounded-xl border border-slate-200 bg-white"
                    >
                      <div
                        className={`flex w-full items-center px-3 py-2 text-left text-sm font-semibold text-slate-900 transition ${
                          isSelectedSection ? "bg-emerald-50" : "bg-white"
                        }`}
                      >
                        <span className="truncate">{parent.name}</span>
                      </div>

                      {children.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-3 py-3 lg:grid-cols-4">
                          {children.map((child) => {
                            const isActive = child.id === selectedCategoryId;
                            return (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => onSelectCategory(child.id)}
                                className={`flex items-center justify-center rounded-lg px-2 py-2 text-center text-xs font-semibold transition ${
                                  isActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <span className="line-clamp-2">
                                  {child.name}
                                </span>
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
              No hay categorías disponibles.
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
};

export default CategoriesPanel;
