import { useCallback, useEffect, useMemo, useState } from "react";
import CategoriesPanel from "./features/catalog/CategoriesPanel";
import type {
  CatalogCategoryNode,
  CatalogProductSummary,
  GetCategoryDetailResponse,
  GetRootCategoriesResponse,
} from "./features/catalog/types";
import { formatEuro, formatUnitPrice } from "./shared/lib/format";

type FetchStatus = "idle" | "loading" | "error" | "success";

const CATEGORIES_ERROR_MESSAGE = "No se pudieron cargar las categorías.";
const ITEMS_ERROR_MESSAGE = "No se pudieron cargar los productos.";

const getDefaultCategory = (categories: CatalogCategoryNode[]) => {
  const parents = categories
    .filter((category) => category.level === 0)
    .sort((a, b) => a.order - b.order);
  const parent = parents[0];

  if (!parent) {
    return null;
  }

  const children = categories
    .filter(
      (category) =>
        category.level === 1 && category.parentId && category.parentId === parent.id
    )
    .sort((a, b) => a.order - b.order);

  return children[0] ?? null;
};

function App() {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [categoriesStatus, setCategoriesStatus] = useState<FetchStatus>("idle");
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CatalogCategoryNode[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(
    null
  );
  const [itemsStatus, setItemsStatus] = useState<FetchStatus>("idle");
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [items, setItems] = useState<CatalogProductSummary[]>([]);

  const hasItems = items.length > 0;

  const loadCategories = useCallback(async () => {
    setCategoriesStatus("loading");
    setCategoriesError(null);

    try {
      const response = await fetch("/api/catalog/categories");

      if (!response.ok) {
        throw new Error(CATEGORIES_ERROR_MESSAGE);
      }

      const data = (await response.json()) as GetRootCategoriesResponse;
      const nextCategories = Array.isArray(data.categories)
        ? data.categories
        : [];

      setCategories(nextCategories);
      setCategoriesStatus("success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : CATEGORIES_ERROR_MESSAGE;
      setCategoriesError(message);
      setCategoriesStatus("error");
    }
  }, []);

  const loadItems = useCallback(async (categoryId: string) => {
    setItemsStatus("loading");
    setItemsError(null);
    setItems([]);

    try {
      const response = await fetch(`/api/catalog/categories/${categoryId}`);

      if (!response.ok) {
        throw new Error(ITEMS_ERROR_MESSAGE);
      }

      const data = (await response.json()) as GetCategoryDetailResponse;
      const products = data.subcategories?.[0]?.products ?? [];

      setItems(products);
      setItemsStatus("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : ITEMS_ERROR_MESSAGE;
      setItemsError(message);
      setItemsStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (categoriesStatus !== "success" || selectedCategoryId) {
      return;
    }

    const defaultCategory = getDefaultCategory(categories);

    if (!defaultCategory) {
      setSelectedCategoryId(null);
      setSelectedCategoryName(null);
      setItems([]);
      setItemsStatus("success");
      return;
    }

    setSelectedCategoryId(defaultCategory.id);
    setSelectedCategoryName(defaultCategory.name);
  }, [categories, categoriesStatus, selectedCategoryId]);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }

    void loadItems(selectedCategoryId);
  }, [loadItems, selectedCategoryId]);

  const handleSelectCategory = (id: string) => {
    setSelectedCategoryId(id);
    const selectedCategory = categories.find((category) => category.id === id);
    setSelectedCategoryName(selectedCategory?.name ?? null);
  };

  const categoriesEmpty =
    categoriesStatus === "success" && categories.length === 0;
  const itemsEmpty =
    itemsStatus === "success" && items.length === 0 && !categoriesEmpty;

  const headerSubtitle = useMemo(() => {
    if (!selectedCategoryName) {
      return null;
    }

    return `Categoría: ${selectedCategoryName}`;
  }, [selectedCategoryName]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center justify-between gap-3 sm:flex-1 sm:w-auto sm:justify-start">
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">
                La lista de la compra
              </h1>
              {headerSubtitle ? (
                <p className="text-xs text-slate-500">{headerSubtitle}</p>
              ) : null}
            </div>
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-6 text-slate-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 .95-.68L21 8H6" />
                <circle cx="10" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
              </svg>
              {hasItems ? (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-semibold text-white">
                  {items.length}
                </span>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex w-full items-center gap-2 sm:mt-0 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => setIsCategoriesOpen((prev) => !prev)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isCategoriesOpen
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900"
              }`}
              aria-pressed={isCategoriesOpen}
            >
              Categorías
            </button>
            <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
              Login
            </button>
            <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
              Registro
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {isCategoriesOpen ? (
            <>
              <div className="hidden sm:block sm:w-80 sm:flex-shrink-0" />
              <div
                className="w-full sm:fixed sm:top-[72px] sm:z-40 sm:flex sm:h-[calc(100vh-72px)] sm:w-80 sm:flex-shrink-0 sm:items-center"
                style={{
                  left: "max(16px, calc(50% - 640px + 16px))",
                }}
              >
                <CategoriesPanel
                  open={isCategoriesOpen}
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={handleSelectCategory}
                  loadingCategories={categoriesStatus === "loading"}
                  errorCategories={categoriesError}
                  onRetryLoadCategories={loadCategories}
                />
              </div>
            </>
          ) : null}
          <section className="flex-1">
            {itemsStatus === "loading" ? (
              <p className="text-sm text-slate-500">Cargando productos...</p>
            ) : null}
            {itemsStatus === "error" ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  {itemsError ?? ITEMS_ERROR_MESSAGE}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    selectedCategoryId ? loadItems(selectedCategoryId) : null
                  }
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
                >
                  Reintentar
                </button>
              </div>
            ) : null}
            {itemsStatus === "success" && hasItems ? (
              <div className="flex justify-center">
                <div
                  className={`grid gap-4 ${
                    isCategoriesOpen
                      ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 *:48"
                      : "grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 *:48"
                  }`}
                >
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="flex h-full flex-col rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex flex-col p-3">
                        <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
                              Sin imagen
                            </div>
                          )}
                        </div>
                        <div className="mt-3 space-y-1">
                          <h2 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-900">
                            {item.name}
                          </h2>
                          <div className="text-base font-semibold text-slate-900">
                            {formatEuro(item.price)}
                          </div>
                          {item.unitPrice != null && item.unitFormat ? (
                            <div className="text-xs text-slate-500">
                              {formatUnitPrice(item.unitPrice, item.unitFormat)}
                            </div>
                          ) : null}
                        </div>
                        <button className="mt-4 flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-600">
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
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Añadir
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
            {itemsEmpty ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-lg font-semibold text-slate-800">
                  No hay productos disponibles
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Prueba a seleccionar otra categoría.
                </p>
              </div>
            ) : null}
            {categoriesEmpty ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-lg font-semibold text-slate-800">
                  No hay categorías disponibles
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Vuelve a intentarlo más tarde.
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
