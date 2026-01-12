import { Router } from "express";
import { GetCategoryDetail } from "../application/getCategoryDetail";
import { GetRootCategories } from "../application/getRootCategories";
import { categoryDetailParamsSchema } from "./schemas";

type CatalogRouterDependencies = {
  getRootCategories: GetRootCategories;
  getCategoryDetail: GetCategoryDetail;
};

export function createCatalogRouter(deps: CatalogRouterDependencies): Router {
  const router = Router();

  router.get("/categories", async (_req, res, next) => {
    try {
      const response = await deps.getRootCategories.execute();
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get("/categories/:id", async (req, res, next) => {
    try {
      const params = categoryDetailParamsSchema.parse(req.params);
      const response = await deps.getCategoryDetail.execute(params.id);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
