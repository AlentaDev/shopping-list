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

const CategoriesPanel = ({ isOpen }: CategoriesPanelProps) => {
  const [status, setStatus] = useState<FetchStatus>("idle");
  const [categories, setCategories] = useState<CatalogCategoryNode[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.level <= 1),
    [categories],
  );

  const fetchCategories = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/catalog/categories");

      if (!response.ok) {
        throw new Error("No se pudieron cargar las categorías.");
      }

      const data = (await response.json()) as CategoriesResponse;

      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setStatus("success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las categorías.";
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
    <aside className="w-full lg:w-80">
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
                {errorMessage ?? "No se pudieron cargar las categorías."}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {visibleCategories.map((category) => {
                const isActive = category.id === activeCategoryId;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategoryId(category.id)}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                      isActive
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          ) : null}
          {status === "success" && visibleCategories.length === 0 ? (
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
