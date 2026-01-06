import { useCallback, useEffect, useMemo, useState } from "react";

type CatalogCategoryNode = {
  id: string;
  name: string;
  order: number;
  level: 0 | 1 | 2;
  parentId?: string;
  published?: boolean;
};

type CategoriesPanelProps = {
  isOpen: boolean;
};

type FetchStatus = "idle" | "loading" | "error" | "success";

type CategoriesResponse = {
  categories: CatalogCategoryNode[];
};

const LOAD_ERROR_MESSAGE = "No se pudieron cargar las categorías.";

const CategoriesPanel = ({ isOpen }: CategoriesPanelProps) => {
  const [status, setStatus] = useState<FetchStatus>("idle");
  const [categories, setCategories] = useState<CatalogCategoryNode[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [expandedParentId, setExpandedParentId] = useState<string | null>(null);

  const parents = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.level === 0 || (category.level === 1 && !category.parentId)
      ),
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
    // ordenar por order asc
    map.forEach((list, key) => {
      map.set(
        key,
        [...list].sort((a, b) => a.order - b.order)
      );
    });
    return map;
  }, [categories]);

  const fetchCategories = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/catalog/categories");

      if (!response.ok) {
        throw new Error(LOAD_ERROR_MESSAGE);
      }

      const data = (await response.json()) as CategoriesResponse;

      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setStatus("success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : LOAD_ERROR_MESSAGE;
      setErrorMessage(message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!isOpen || status !== "idle") {
      return;
    }

    void fetchCategories();
  }, [fetchCategories, isOpen, status]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-full sm:w-80">
      <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Categorías</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {status === "loading" ? (
            <p className="text-sm text-slate-500">Cargando categorías...</p>
          ) : null}
          {status === "error" ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                {errorMessage ?? LOAD_ERROR_MESSAGE}
              </p>
              <button
                type="button"
                onClick={fetchCategories}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Reintentar
              </button>
            </div>
          ) : null}
          {status === "success" ? (
            <div className="space-y-2">
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
                          setExpandedParentId((prev) =>
                            prev === parent.id ? null : parent.id
                          );
                          if (children.length > 0) {
                            setActiveCategoryId(children[0].id);
                          }
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-900"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className={`h-4 w-4 text-slate-500 transition-transform ${
                            isExpanded ? "rotate-180" : "rotate-90"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        <span className="truncate">{parent.name}</span>
                      </button>

                      {isExpanded && children.length > 0 ? (
                        <div className="space-y-1 border-t border-slate-100 px-3 py-2">
                          {children.map((child) => {
                            const isActive = child.id === activeCategoryId;
                            return (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => setActiveCategoryId(child.id)}
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
          {status === "success" && parents.length === 0 ? (
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
