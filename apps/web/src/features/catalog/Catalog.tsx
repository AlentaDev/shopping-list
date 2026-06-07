import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import CategoriesPanel from "./components/CategoriesPanel";
import ProductsCategory from "./components/ProductsCategory";
import { useAuth } from "@src/context/useAuth";
import { useCatalog } from "./services/useCatalog";
import { UI_TEXT } from "@src/shared/constants/ui";
import { useToast } from "@src/context/useToast";
import { useDraftProviderConflict } from "@src/context/useDraftProviderConflict";
import { useList } from "@src/context/useList";
import { FETCH_STATUS } from "@src/shared/constants/appState";
import { isMobileCatalogInteractionMode } from "@src/shared/utils/isMobileCatalogInteractionMode";

const ITEMS_ERROR_MESSAGE = UI_TEXT.CATALOG.LOAD_PRODUCTS_ERROR_MESSAGE;
const SWITCHING_PRODUCTS_MESSAGE = UI_TEXT.CATALOG.SWITCHING_PRODUCTS_MESSAGE;

const scrollToCatalogStart = () => {
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

const getGridClasses = (
  isCategoriesOpen: boolean,
  isMobileInteractionMode: boolean,
) =>
  isCategoriesOpen && !isMobileInteractionMode
    ? "grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 *:48"
    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 *:48";

type ProductSkeletonGridProps = {
  count: number;
  isCategoriesOpen: boolean;
  isMobileInteractionMode: boolean;
};

type CatalogProps = {
  providerId?: string;
  initialCategoryId?: string;
  onCategoryRouteChange?: (categoryId: string) => void;
  isCategoriesOpen?: boolean;
  openMobileCategoriesRequestKey?: number;
  onItemsCountChange?: (count: number) => void;
  onRequestActiveEditConflict?: (input: {
    currentProviderId: string;
    requestedProviderId: string;
  }) => void;
};

const ProductSkeletonGrid = ({
  count,
  isCategoriesOpen,
  isMobileInteractionMode,
}: ProductSkeletonGridProps) => (
  <div
    data-testid="catalog-product-skeleton-grid"
    className={`grid gap-4 ${getGridClasses(isCategoriesOpen, isMobileInteractionMode)}`}
  >
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        data-testid={`catalog-product-skeleton-card-${index}`}
        className="flex h-full flex-col rounded-2xl bg-white shadow-sm animate-pulse"
      >
        <div className="flex flex-col p-3">
          <div className="aspect-square rounded-xl bg-slate-200" />
          <div className="mt-3 space-y-1">
            <div
              data-testid={`catalog-product-skeleton-name-${index}`}
              className="flex min-h-[2.5rem] flex-col justify-center gap-1"
            >
              <div className="h-4 w-3/4 rounded-full bg-slate-200" />
              <div className="h-4 w-1/2 rounded-full bg-slate-200" />
            </div>
            <div className="h-6 w-1/3 rounded-full bg-slate-200" />
            <div className="h-3 w-2/5 rounded-full bg-slate-100" />
          </div>
          <div className="mt-4 h-8 rounded-full bg-slate-200" />
        </div>
      </div>
    ))}
  </div>
);

const Catalog = ({
  providerId = "mercadona",
  initialCategoryId,
  onCategoryRouteChange,
  isCategoriesOpen = false,
  openMobileCategoriesRequestKey = 0,
  onItemsCountChange,
  onRequestActiveEditConflict,
}: CatalogProps) => {
  const [dismissedMobileRequestKey, setDismissedMobileRequestKey] = useState(0);
  const isMobileInteractionMode = isMobileCatalogInteractionMode();
  const { addItem } = useList();
  const { confirmAndReset } = useDraftProviderConflict({
    onActiveEditConflict: ({ currentProviderId, requestedProviderId }) => {
      onRequestActiveEditConflict?.({ currentProviderId, requestedProviderId });
    },
  });
  const { authUser } = useAuth();
  const { showToast } = useToast();
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
  } = useCatalog({ providerId, initialCategoryId, userId: authUser?.id });

  const sections = categoryDetail?.sections ?? [];
  const totalProducts = sections.reduce(
    (total, section) => total + section.products.length,
    0,
  );
  const hasItems = totalProducts > 0;
  const hasBonpreuNavigationSections =
    providerId === "bonpreuesclat" &&
    !hasItems &&
    sections.some((section) => section.subcategoryId);
  const skeletonCount = 8;
  const isMobileCategoriesOpen =
    isCategoriesOpen && openMobileCategoriesRequestKey > dismissedMobileRequestKey;

  useLayoutEffect(() => {
    if (!selectedCategoryId) {
      return;
    }

    scrollToCatalogStart();
  }, [selectedCategoryId]);

  useEffect(() => {
    onItemsCountChange?.(totalProducts);
  }, [onItemsCountChange, totalProducts]);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }

    onCategoryRouteChange?.(selectedCategoryId);
  }, [onCategoryRouteChange, selectedCategoryId]);

  const handleSelectCategory = useCallback((id: string) => {
    selectCategory(id);
    scrollToCatalogStart();
    setDismissedMobileRequestKey(openMobileCategoriesRequestKey);
  }, [openMobileCategoriesRequestKey, selectCategory]);

  const categoriesEmpty =
    categoriesStatus === FETCH_STATUS.SUCCESS && categories.length === 0;
  const itemsEmpty =
    detailStatus === FETCH_STATUS.SUCCESS &&
    !hasItems &&
    !categoriesEmpty &&
    !hasBonpreuNavigationSections;
  const isInitialProductsLoading = detailStatus === FETCH_STATUS.LOADING && !hasItems;

  const handleAddProduct = useCallback(
    async (product: (typeof sections)[number]["products"][number], subcategoryName: string) => {
      const canProceed = await confirmAndReset({ requestedProviderId: providerId });

      if (!canProceed) {
        return;
      }

      addItem({
        id: product.id,
        source: providerId,
        sourceProductId: product.id,
        serverItemId: null,
        name: product.name,
        category: subcategoryName,
        categorySnapshot: categoryDetail?.categoryName ?? subcategoryName,
        subcategorySnapshot: subcategoryName ?? null,
        thumbnail: product.thumbnail,
        price: product.price,
        quantity: 1,
      });
      showToast({
        message: UI_TEXT.CATALOG.TOAST_ADDED_MESSAGE,
        productName: product.name,
        thumbnail: product.thumbnail ?? null,
      });
    },
    [
      addItem,
      categoryDetail?.categoryName,
      confirmAndReset,
      providerId,
      showToast,
    ],
  );

  return (
    <>
      {isCategoriesOpen ? (
        <div
          className="pointer-events-none fixed top-24 z-30 hidden w-80 md:block"
          style={{
            left: "max(1rem, calc((100vw - 80rem) / 2 + 1rem))",
          }}
        >
          <div className="pointer-events-auto">
            <CategoriesPanel
              open={isCategoriesOpen}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
              loadingCategories={categoriesStatus === FETCH_STATUS.LOADING}
              errorCategories={categoriesError}
              onRetryLoadCategories={reloadCategories}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:overflow-visible">
        {isCategoriesOpen ? (
          <>
            {isMobileCategoriesOpen ? (
              <div
                className="fixed inset-0 z-50 md:hidden"
                data-testid="mobile-categories-overlay"
              >
                <button
                  type="button"
                  aria-label="Close categories panel"
                  className="absolute inset-0 bg-slate-900/30"
                  onClick={() => setDismissedMobileRequestKey(openMobileCategoriesRequestKey)}
                />
                <div className="absolute inset-x-0 top-24 bottom-0 overflow-y-auto rounded-t-2xl bg-white p-4">
                  <CategoriesPanel
                    open={isCategoriesOpen}
                    isMobile
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={handleSelectCategory}
                    loadingCategories={categoriesStatus === FETCH_STATUS.LOADING}
                    errorCategories={categoriesError}
                    onRetryLoadCategories={reloadCategories}
                  />
                </div>
              </div>
            ) : null}
            <div className="hidden w-80 shrink-0 md:block" />
          </>
        ) : null}
        <section className="flex-1 space-y-6">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {categoryDetail?.categoryName || UI_TEXT.CATALOG.TITLE}
          </h1>
          {isInitialProductsLoading ? (
            <div className="space-y-4" aria-live="polite" aria-busy="true">
              <h2 className="text-lg font-semibold text-slate-900">
                {UI_TEXT.CATALOG.LOADING_PRODUCTS_MESSAGE}
              </h2>
              <div className="flex justify-center">
                <div className="w-full">
                  <ProductSkeletonGrid
                    count={skeletonCount}
                    isCategoriesOpen={isCategoriesOpen}
                    isMobileInteractionMode={isMobileInteractionMode}
                  />
                </div>
              </div>
            </div>
          ) : null}
          {detailStatus === FETCH_STATUS.ERROR ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                {detailError ?? ITEMS_ERROR_MESSAGE}
              </p>
              <button
                type="button"
                onClick={reloadDetail}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
              >
                {UI_TEXT.CATALOG.RETRY_BUTTON_LABEL}
              </button>
            </div>
          ) : null}
          {hasItems ? (
            <div
              className={`flex justify-center transition-opacity duration-200 ${
                detailStatus === FETCH_STATUS.LOADING ? "opacity-60" : "opacity-100"
              }`}
            >
              <div className="flex w-full flex-col gap-8">
                {detailStatus === FETCH_STATUS.LOADING ? (
                  <p className="text-sm text-slate-500">{SWITCHING_PRODUCTS_MESSAGE}</p>
                ) : null}
                {sections.map((section) => (
                  <ProductsCategory
                    key={section.subcategoryId || section.subcategoryName}
                    subcategoryName={section.subcategoryName}
                    products={section.products}
                    gridClassName={getGridClasses(
                      isCategoriesOpen,
                      isMobileInteractionMode,
                    )}
                    onAddProduct={(product) => {
                      handleAddProduct(product, section.subcategoryName);
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}
          {hasBonpreuNavigationSections ? (
            <div className="space-y-3">
              {sections.map((section) => (
                <button
                  key={section.subcategoryId || section.subcategoryName}
                  type="button"
                  onClick={() => handleSelectCategory(section.subcategoryId)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span>{section.subcategoryName}</span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          ) : null}
          {itemsEmpty ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-semibold text-slate-800">
                {UI_TEXT.CATALOG.EMPTY_PRODUCTS_TITLE}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {UI_TEXT.CATALOG.EMPTY_PRODUCTS_SUBTITLE}
              </p>
            </div>
          ) : null}
          {categoriesEmpty ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-semibold text-slate-800">
                {UI_TEXT.CATALOG.EMPTY_CATEGORIES_TITLE}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {UI_TEXT.CATALOG.EMPTY_CATEGORIES_SUBTITLE}
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
};

export default Catalog;
