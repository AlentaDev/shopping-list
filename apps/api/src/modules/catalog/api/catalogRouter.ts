import { Router } from "express";
import type {
  GetCategoryDetailResponse,
  GetRootCategoriesResponse,
} from "../domain/catalogTypes.js";
import { categoryDetailParamsSchema, providerParamsSchema } from "./schemas.js";

type CatalogRouterDependencies = {
  getRootCategories: {
    execute: (provider: string) => Promise<GetRootCategoriesResponse>;
  };
  getCategoryDetail: {
    execute: (provider: string, categoryId: string) => Promise<GetCategoryDetailResponse>;
  };
};

export function createCatalogRouter(deps: CatalogRouterDependencies): Router {
  const router = Router();

  router.get("/:provider/categories", async (req, res, next) => {
    try {
      const params = providerParamsSchema.parse(req.params);
      const response = await deps.getRootCategories.execute(params.provider);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:provider/categories/:id", async (req, res, next) => {
    try {
      const params = categoryDetailParamsSchema.parse(req.params);
      const response = await deps.getCategoryDetail.execute(
        params.provider,
        params.id,
      );
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
