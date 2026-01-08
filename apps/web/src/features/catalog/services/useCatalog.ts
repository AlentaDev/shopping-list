import { useCallback, useEffect, useState } from "react";
import type {
  CatalogCategoryNode,
  CatalogProductSummary,
} from "./types";
import { getCategoryDetail, getRootCategories } from "./CatalogService";

export type FetchStatus = "idle" | "loading" | "error" | "success";

type CatalogState = {
  categoriesStatus: FetchStatus;
  categoriesError: string | null;
  categories: CatalogCategoryNode[];
  itemsStatus: FetchStatus;
  itemsError: string | null;
  items: CatalogProductSummary[];
  selectedCategoryId: string | null;
};

type UseCatalogResult = CatalogState & {
  selectCategory: (id: string) => void;
  reloadCategories: () => void;
  reloadItems: () => void;
};

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
        category.level === 1 &&
        category.parentId &&
        category.parentId === parent.id
    )
    .sort((a, b) => a.order - b.order);

  return children[0] ?? null;
};

export const useCatalog = (): UseCatalogResult => {
  const [categoriesStatus, setCategoriesStatus] = useState<FetchStatus>("idle");
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CatalogCategoryNode[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [itemsStatus, setItemsStatus] = useState<FetchStatus>("idle");
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [items, setItems] = useState<CatalogProductSummary[]>([]);

  const loadCategories = useCallback(async () => {
    setCategoriesStatus("loading");
    setCategoriesError(null);

    try {
      const data = await getRootCategories({
        errorMessage: CATEGORIES_ERROR_MESSAGE,
      });
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
      const data = await getCategoryDetail(categoryId, {
        errorMessage: ITEMS_ERROR_MESSAGE,
      });
      const products = data.subcategories?.[0]?.products ?? [];

      setItems(products);
      setItemsStatus("success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ITEMS_ERROR_MESSAGE;
      setItemsError(message);
      setItemsStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (categoriesStatus !== "success" || selectedCategoryId) {
      return;
    }

    const defaultCategory = getDefaultCategory(categories);

    if (!defaultCategory) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCategoryId(null);
      setItems([]);
      setItemsStatus("success");
      return;
    }

    setSelectedCategoryId(defaultCategory.id);
  }, [categories, categoriesStatus, selectedCategoryId]);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadItems(selectedCategoryId);
  }, [loadItems, selectedCategoryId]);

  const selectCategory = (id: string) => {
    setSelectedCategoryId(id);
  };

  const reloadCategories = () => {
    void loadCategories();
  };

  const reloadItems = () => {
    if (!selectedCategoryId) {
      return;
    }

    void loadItems(selectedCategoryId);
  };

  return {
    categoriesStatus,
    categoriesError,
    categories,
    itemsStatus,
    itemsError,
    items,
    selectedCategoryId,
    selectCategory,
    reloadCategories,
    reloadItems,
  };
};
