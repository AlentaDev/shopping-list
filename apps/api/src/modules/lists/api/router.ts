import { Router } from "express";
import type { Request, RequestHandler } from "express";
import { AppError } from "../../../shared/errors/appError";
import { API_ERROR_MESSAGES } from "../../../shared/constants/apiErrorMessages";
import type { AuthenticatedRequest } from "../../../shared/web/requireAuth";
import { AddCatalogItem } from "../application/AddCatalogItem";
import { AddManualItem } from "../application/AddManualItem";
import { CreateList } from "../application/CreateList";
import { GetList } from "../application/GetList";
import { ListLists } from "../application/ListLists";
import { RemoveItem } from "../application/RemoveItem";
import { UpdateItem } from "../application/UpdateItem";
import {
  addCatalogItemSchema,
  addItemSchema,
  createListSchema,
  itemParamsSchema,
  listParamsSchema,
  patchItemSchema,
} from "./validation";

type ListsRouterDependencies = {
  createList: CreateList;
  listLists: ListLists;
  getList: GetList;
  addManualItem: AddManualItem;
  addCatalogItem: AddCatalogItem;
  updateItem: UpdateItem;
  removeItem: RemoveItem;
  requireAuth: RequestHandler;
};

export function createListsRouter(deps: ListsRouterDependencies): Router {
  const router = Router();

  router.use(deps.requireAuth);

  router.post("/", async (req, res, next) => {
    try {
      const input = createListSchema.parse(req.body);
      const userId = getUserId(req);
      const response = await deps.createList.execute({
        userId,
        title: input.title,
      });

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const response = await deps.listLists.execute(userId);

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const params = listParamsSchema.parse(req.params);
      const userId = getUserId(req);
      const response = await deps.getList.execute(userId, params.id);

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/items", async (req, res, next) => {
    try {
      const params = listParamsSchema.parse(req.params);
      const input = addItemSchema.parse(req.body);
      const userId = getUserId(req);
      const response = await deps.addManualItem.execute({
        userId,
        listId: params.id,
        name: input.name,
        qty: input.qty,
        note: input.note,
      });

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/items/from-catalog", async (req, res, next) => {
    try {
      const params = listParamsSchema.parse(req.params);
      const input = addCatalogItemSchema.parse(req.body);
      const userId = getUserId(req);
      const response = await deps.addCatalogItem.execute({
        userId,
        listId: params.id,
        productId: input.productId,
        qty: input.qty,
        note: input.note,
      });

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id/items/:itemId", async (req, res, next) => {
    try {
      const params = itemParamsSchema.parse(req.params);
      const input = patchItemSchema.parse(req.body);
      const userId = getUserId(req);
      const response = await deps.updateItem.execute({
        userId,
        listId: params.id,
        itemId: params.itemId,
        name: input.name,
        qty: input.qty,
        checked: input.checked,
        note: input.note,
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id/items/:itemId", async (req, res, next) => {
    try {
      const params = itemParamsSchema.parse(req.params);
      const userId = getUserId(req);
      const response = await deps.removeItem.execute({
        userId,
        listId: params.id,
        itemId: params.itemId,
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function getUserId(req: Request): string {
  const authRequest = req as AuthenticatedRequest;
  if (!authRequest.userId) {
    throw new AppError(
      401,
      "not_authenticated",
      API_ERROR_MESSAGES.notAuthenticated
    );
  }

  return authRequest.userId;
}
