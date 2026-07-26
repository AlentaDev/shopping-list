import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type SelectedCategoryState = {
  providerId: string;
  categoryId: string | null;
};

type CategoriesState = {
  providerId: string;
  status: FetchStatus;
  error: string | null;
  items: CatalogCategoryNode[];
};

type DetailState = {
  providerId: string;
  status: FetchStatus;
  error: string | null;
  data: CatalogCategoryDetail | null;
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
  const childrenByParent = new Map<string, CatalogCategoryNode[]>();

  for (const category of categories) {
    if (category.parentId) {
      const siblings = childrenByParent.get(category.parentId) ?? [];
      siblings.push(category);
      childrenByParent.set(category.parentId, siblings);
    }
  }

  const roots = categories
    .filter((category) => category.level === 0)
    .sort((a, b) => a.order - b.order);
  const firstRoot = roots[0];

  if (!firstRoot) {
    return null;
  }

  const findFirstLeaf = (category: CatalogCategoryNode): CatalogCategoryNode => {
    const children = (childrenByParent.get(category.id) ?? []).sort(
      (a, b) => a.order - b.order,
    );

    if (children.length === 0) {
      return category;
    }

    return findFirstLeaf(children[0]);
  };

  return findFirstLeaf(firstRoot);
};

type UseCatalogArgs = {
  providerId: string;
  initialCategoryId?: string;
  userId?: string;
};

export const useCatalog = ({ providerId, initialCategoryId, userId }: UseCatalogArgs): UseCatalogResult => {
  const categoriesRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const [categoriesState, setCategoriesState] = useState<CategoriesState>({
    providerId,
    status: FETCH_STATUS.IDLE,
    error: null,
    items: [],
  });
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategoryState>(
    {
      providerId,
      categoryId: null,
    },
  );
  const [detailState, setDetailState] = useState<DetailState>({
    providerId,
    status: FETCH_STATUS.IDLE,
    error: null,
    data: null,
  });

  const rememberedCategoryId = useMemo(
    () =>
      !initialCategoryId && userId ? getLastCategory(userId, providerId) : null,
    [initialCategoryId, providerId, userId],
  );

  const categories =
    categoriesState.providerId === providerId ? categoriesState.items : [];

  const categoriesStatus =
    categoriesState.providerId === providerId
      ? categoriesState.status
      : FETCH_STATUS.IDLE;

  const categoriesError =
    categoriesState.providerId === providerId ? categoriesState.error : null;

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

  const selectedCategoryId =
    selectedCategory.providerId === providerId
      ? selectedCategory.categoryId
      : null;

  const activeCategoryId = selectedCategoryId ?? fallbackSelectedCategoryId;

  const loadCategories = useCallback(async () => {
    const requestId = categoriesRequestIdRef.current + 1;
    categoriesRequestIdRef.current = requestId;

    setCategoriesState({
      providerId,
      status: FETCH_STATUS.LOADING,
      error: null,
      items: [],
    });

    try {
      const data = await getRootCategories(providerId, {
        errorMessage: CATEGORIES_ERROR_MESSAGE,
      });
      const nextCategories = Array.isArray(data.categories)
        ? data.categories
        : [];

      if (categoriesRequestIdRef.current !== requestId) {
        return;
      }

      setCategoriesState({
        providerId,
        status: FETCH_STATUS.SUCCESS,
        error: null,
        items: nextCategories,
      });
    } catch (error) {
      if (categoriesRequestIdRef.current !== requestId) {
        return;
      }

      const message =
        error instanceof Error ? error.message : CATEGORIES_ERROR_MESSAGE;
      setCategoriesState({
        providerId,
        status: FETCH_STATUS.ERROR,
        error: message,
        items: [],
      });
    }
  }, [providerId]);

  const loadDetail = useCallback(
    async (categoryId: string, categoryName?: string) => {
      const requestId = detailRequestIdRef.current + 1;
      detailRequestIdRef.current = requestId;

      setDetailState((prevDetailState) => {
        const name =
          prevDetailState.providerId === providerId
            ? prevDetailState.data?.categoryName || categoryName || ""
            : categoryName || "";

        return {
          providerId,
          status: FETCH_STATUS.LOADING,
          error: null,
          data: { categoryName: name, sections: [] },
        };
      });

      try {
        const data = await getCategoryDetail(providerId, categoryId, {
          errorMessage: DETAIL_ERROR_MESSAGE,
        });

        if (detailRequestIdRef.current !== requestId) {
          return;
        }

        setDetailState({
          providerId,
          status: FETCH_STATUS.SUCCESS,
          error: null,
          data,
        });
      } catch (error) {
        if (detailRequestIdRef.current !== requestId) {
          return;
        }

        const message =
          error instanceof Error ? error.message : DETAIL_ERROR_MESSAGE;
        setDetailState((prevDetailState) => ({
          providerId,
          status: FETCH_STATUS.ERROR,
          error: message,
          data:
            prevDetailState.providerId === providerId ? prevDetailState.data : null,
        }));
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

  const visibleDetailStatus =
    detailState.providerId === providerId ? detailState.status : FETCH_STATUS.IDLE;

  const visibleDetailError =
    detailState.providerId === providerId ? detailState.error : null;

  const visibleCategoryDetail =
    detailState.providerId === providerId ? detailState.data : null;

  const resolvedDetailStatus =
    categoriesStatus === FETCH_STATUS.SUCCESS && !activeCategoryId
      ? FETCH_STATUS.SUCCESS
      : visibleDetailStatus;

  const resolvedCategoryDetail =
    categoriesStatus === FETCH_STATUS.SUCCESS && !activeCategoryId
      ? EMPTY_CATEGORY_DETAIL
      : visibleCategoryDetail;

  const selectCategory = (id: string) => {
    setSelectedCategory({ providerId, categoryId: id });
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
    detailError: visibleDetailError,
    categoryDetail: resolvedCategoryDetail,
    selectedCategoryId: activeCategoryId,
    selectCategory,
    reloadCategories,
    reloadDetail,
  };
};
