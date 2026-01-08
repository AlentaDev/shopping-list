import { useCallback, useEffect, useState } from "react";
import type {
  CatalogCategoryDetail,
  CatalogCategoryNode,
} from "./types";
import { getCategoryDetail, getRootCategories } from "./CatalogService";

export type FetchStatus = "idle" | "loading" | "error" | "success";

type CatalogState = {
  categoriesStatus: FetchStatus;
  categoriesError: string | null;
  categories: CatalogCategoryNode[];
  detailStatus: FetchStatus;
  detailError: string | null;
  categoryDetail: CatalogCategoryDetail | null;
  selectedCategoryId: string | null;
};

type UseCatalogResult = CatalogState & {
  selectCategory: (id: string) => void;
  reloadCategories: () => void;
  reloadDetail: () => void;
};

const CATEGORIES_ERROR_MESSAGE = "No se pudieron cargar las categorías.";
const DETAIL_ERROR_MESSAGE = "No se pudieron cargar los productos.";

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
  const [detailStatus, setDetailStatus] = useState<FetchStatus>("idle");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [categoryDetail, setCategoryDetail] = useState<CatalogCategoryDetail | null>(
    null
  );

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

  const loadDetail = useCallback(async (categoryId: string) => {
    setDetailStatus("loading");
    setDetailError(null);
    setCategoryDetail(null);

    try {
      const data = await getCategoryDetail(categoryId, {
        errorMessage: DETAIL_ERROR_MESSAGE,
      });

      setCategoryDetail(data);
      setDetailStatus("success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : DETAIL_ERROR_MESSAGE;
      setDetailError(message);
      setDetailStatus("error");
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
      setCategoryDetail({ categoryName: "", sections: [] });
      setDetailStatus("success");
      return;
    }

    setSelectedCategoryId(defaultCategory.id);
  }, [categories, categoriesStatus, selectedCategoryId]);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDetail(selectedCategoryId);
  }, [loadDetail, selectedCategoryId]);

  const selectCategory = (id: string) => {
    setSelectedCategoryId(id);
  };

  const reloadCategories = () => {
    void loadCategories();
  };

  const reloadDetail = () => {
    if (!selectedCategoryId) {
      return;
    }

    void loadDetail(selectedCategoryId);
  };

  return {
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
  };
};
