import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogCategoryDetail, CatalogCategoryNode } from "./types";
import { getCategoryDetail, getRootCategories } from "./CatalogService";
import { FETCH_STATUS } from "@src/shared/constants/appState";
import { getLastCategory, saveLastCategory } from "./CatalogNavigationState";

export type FetchStatus =
  | typeof FETCH_STATUS.IDLE
  | typeof FETCH_STATUS.LOADING
  | typeof FETCH_STATUS.ERROR
  | typeof FETCH_STATUS.SUCCESS;

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
const EMPTY_CATEGORY_DETAIL = { categoryName: "", sections: [] };

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
        category.parentId === parent.id,
    )
    .sort((a, b) => a.order - b.order);

  return children[0] ?? parent;
};

type UseCatalogArgs = {
  providerId: string;
  initialCategoryId?: string;
  userId?: string;
};

export const useCatalog = ({ providerId, initialCategoryId, userId }: UseCatalogArgs): UseCatalogResult => {
  const [categoriesStatus, setCategoriesStatus] = useState<FetchStatus>(
    FETCH_STATUS.IDLE,
  );
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CatalogCategoryNode[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [detailStatus, setDetailStatus] = useState<FetchStatus>(
    FETCH_STATUS.IDLE,
  );
  const [detailError, setDetailError] = useState<string | null>(null);
  const [categoryDetail, setCategoryDetail] =
    useState<CatalogCategoryDetail | null>(null);

  const rememberedCategoryId = useMemo(
    () =>
      !initialCategoryId && userId ? getLastCategory(userId, providerId) : null,
    [initialCategoryId, providerId, userId],
  );

  const fallbackSelectedCategoryId = useMemo(() => {
    if (categoriesStatus !== FETCH_STATUS.SUCCESS) {
      return null;
    }

    if (initialCategoryId) {
      return initialCategoryId;
    }

    if (rememberedCategoryId) {
      return rememberedCategoryId;
    }

    return getDefaultCategory(categories)?.id ?? null;
  }, [categories, categoriesStatus, initialCategoryId, rememberedCategoryId]);

  const activeCategoryId = selectedCategoryId ?? fallbackSelectedCategoryId;

  const loadCategories = useCallback(async () => {
    setCategoriesStatus(FETCH_STATUS.LOADING);
    setCategoriesError(null);

    try {
      const data = await getRootCategories(providerId, {
        errorMessage: CATEGORIES_ERROR_MESSAGE,
      });
      const nextCategories = Array.isArray(data.categories)
        ? data.categories
        : [];

      setCategories(nextCategories);
      setCategoriesStatus(FETCH_STATUS.SUCCESS);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : CATEGORIES_ERROR_MESSAGE;
      setCategoriesError(message);
      setCategoriesStatus(FETCH_STATUS.ERROR);
    }
  }, [providerId]);

  const loadDetail = useCallback(
    async (categoryId: string, categoryName?: string) => {
      setDetailStatus(FETCH_STATUS.LOADING);
      setDetailError(null);
      // Preservar el categoryName durante la recarga, usando el prevDetail o el nombre pasado
      setCategoryDetail((prevDetail) => {
        const name = prevDetail?.categoryName || categoryName || "";
        return { categoryName: name, sections: [] };
      });

      try {
        const data = await getCategoryDetail(providerId, categoryId, {
          errorMessage: DETAIL_ERROR_MESSAGE,
        });

        setCategoryDetail(data);
        setDetailStatus(FETCH_STATUS.SUCCESS);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : DETAIL_ERROR_MESSAGE;
        setDetailError(message);
        setDetailStatus(FETCH_STATUS.ERROR);
      }
    },
    [providerId],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!activeCategoryId) {
      return;
    }

    const category = categories.find((cat) => cat.id === activeCategoryId);
    const timeoutId = window.setTimeout(() => {
      void loadDetail(activeCategoryId, category?.name);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCategoryId, categories, loadDetail]);

  const resolvedDetailStatus =
    categoriesStatus === FETCH_STATUS.SUCCESS && !activeCategoryId
      ? FETCH_STATUS.SUCCESS
      : detailStatus;

  const resolvedCategoryDetail =
    categoriesStatus === FETCH_STATUS.SUCCESS && !activeCategoryId
      ? EMPTY_CATEGORY_DETAIL
      : categoryDetail;

  const selectCategory = (id: string) => {
    setSelectedCategoryId(id);
    if (userId) {
      saveLastCategory(userId, providerId, id);
    }
  };

  const reloadCategories = () => {
    void loadCategories();
  };

  const reloadDetail = () => {
    if (!activeCategoryId) {
      return;
    }

    void loadDetail(activeCategoryId);
  };

  return {
    categoriesStatus,
    categoriesError,
    categories,
    detailStatus: resolvedDetailStatus,
    detailError,
    categoryDetail: resolvedCategoryDetail,
    selectedCategoryId: activeCategoryId,
    selectCategory,
    reloadCategories,
    reloadDetail,
  };
};
