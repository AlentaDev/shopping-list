import { useEffect } from "react";
import CategoriesPanel from "./components/CategoriesPanel";
import ProductsCategory from "./components/ProductsCategory";
import { useCatalog } from "./services/useCatalog";

const ITEMS_ERROR_MESSAGE = "No se pudieron cargar los productos.";

const getGridClasses = (isCategoriesOpen: boolean) =>
  isCategoriesOpen
    ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 *:48"
    : "grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 *:48";

type ProductSkeletonGridProps = {
  count: number;
  isCategoriesOpen: boolean;
};

type CatalogProps = {
  isCategoriesOpen?: boolean;
  onItemsCountChange?: (count: number) => void;
};

const ProductSkeletonGrid = ({
  count,
  isCategoriesOpen,
}: ProductSkeletonGridProps) => (
  <div className={`grid gap-4 ${getGridClasses(isCategoriesOpen)}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="flex h-full flex-col rounded-2xl bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 p-3">
          <div className="aspect-square animate-pulse rounded-xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-200" />
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="mt-2 h-8 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
    ))}
  </div>
);

const Catalog = ({
  isCategoriesOpen = false,
  onItemsCountChange,
}: CatalogProps) => {
  const {
    categoriesStatus,
    categoriesError,
    categories,
    detailStatus,
    detailError,
    categoryDetail,
    selectedCategoryId,
    selectCategory,
    reloadCategories,
    reloadDetail,
  } = useCatalog();

  const sections = categoryDetail?.sections ?? [];
  const totalProducts = sections.reduce(
    (total, section) => total + section.products.length,
    0
  );
  const hasItems = totalProducts > 0;
  const skeletonCount = 8;

  useEffect(() => {
    onItemsCountChange?.(totalProducts);
  }, [onItemsCountChange, totalProducts]);

  const handleSelectCategory = (id: string) => {
    selectCategory(id);
  };

  const categoriesEmpty =
    categoriesStatus === "success" && categories.length === 0;
  const itemsEmpty =
    detailStatus === "success" && !hasItems && !categoriesEmpty;

  return (
    <>
      {isCategoriesOpen ? (
        <div
          className="pointer-events-none fixed top-24 z-30 w-80"
          style={{
            left: "calc((100vw - 80rem) / 2 + 1rem)",
          }}
        >
          <div className="pointer-events-auto">
            <CategoriesPanel
              open={isCategoriesOpen}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
              loadingCategories={categoriesStatus === "loading"}
              errorCategories={categoriesError}
              onRetryLoadCategories={reloadCategories}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:overflow-visible">
        {isCategoriesOpen ? <div className="w-full sm:w-80 sm:shrink-0" /> : null}
        <section className="flex-1 space-y-6">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {categoryDetail?.categoryName || "Catálogo"}
          </h1>
          {detailStatus === "loading" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Cargando productos...</p>
              <ProductSkeletonGrid
                count={skeletonCount}
                isCategoriesOpen={isCategoriesOpen}
              />
            </div>
          ) : null}
          {detailStatus === "error" ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                {detailError ?? ITEMS_ERROR_MESSAGE}
              </p>
              <button
                type="button"
                onClick={reloadDetail}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Reintentar
              </button>
            </div>
          ) : null}
          {detailStatus === "success" && hasItems ? (
            <div className="flex justify-center transition-opacity duration-300">
              <div className="flex w-full flex-col gap-8">
                {sections.map((section) => (
                  <ProductsCategory
                    key={section.subcategoryName}
                    subcategoryName={section.subcategoryName}
                    products={section.products}
                    gridClassName={getGridClasses(isCategoriesOpen)}
                  />
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
    </>
  );
};

export default Catalog;
