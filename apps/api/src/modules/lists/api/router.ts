import { Router } from "express";
import type { Request, RequestHandler } from "express";
import { AppError } from "@src/shared/errors/appError.js";
import { API_ERROR_MESSAGES } from "@src/shared/constants/apiErrorMessages.js";
import type { AuthenticatedRequest } from "@src/shared/web/requireAuth.js";
import { AddCatalogItem } from "../application/AddCatalogItem.js";
import { CreateList } from "../application/CreateList.js";
import { GetList } from "../application/GetList.js";
import { ListLists } from "../application/ListLists.js";
import { DeleteList } from "../application/DeleteList.js";
import { RemoveItem } from "../application/RemoveItem.js";
import { UpdateItem } from "../application/UpdateItem.js";
import { UpdateListStatus } from "../application/UpdateListStatus.js";
import { GetAutosaveDraft } from "../application/GetAutosaveDraft.js";
import { DiscardAutosaveDraft } from "../application/DiscardAutosaveDraft.js";
import { CompleteList } from "../application/CompleteList.js";
import { ReuseList } from "../application/ReuseList.js";
import { UpsertAutosaveDraft } from "../application/UpsertAutosaveDraft.js";
import { StartListEditing } from "../application/StartListEditing.js";
import { FinishListEdit } from "../application/FinishListEdit.js";
import {
  addCatalogItemSchema,
  activateListSchema,
  completeListSchema,
  createListSchema,
  editingSchema,
  itemParamsSchema,
  listParamsSchema,
  listQuerySchema,
  patchItemSchema,
  upsertAutosaveSchema,
} from "./validation.js";

type ListsRouterDependencies = {
  createList: CreateList;
  listLists: ListLists;
  getList: GetList;
  deleteList: DeleteList;
  addCatalogItem: AddCatalogItem;
  updateItem: UpdateItem;
  removeItem: RemoveItem;
  updateListStatus: UpdateListStatus;
  completeList: CompleteList;
  reuseList: ReuseList;
  startListEditing: StartListEditing;
  finishListEdit: FinishListEdit;
  getAutosaveDraft: GetAutosaveDraft;
  discardAutosaveDraft: DiscardAutosaveDraft;
  upsertAutosaveDraft: UpsertAutosaveDraft;
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
      const query = listQuerySchema.parse(req.query);
      const response = await deps.listLists.execute(userId, {
        status: query.status,
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get("/autosave", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const response = await deps.getAutosaveDraft.execute(userId);
      if (!response) {
        res.status(204).end();
        return;
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.put("/autosave", async (req, res, next) => {
    try {
      const input = upsertAutosaveSchema.parse(req.body);
      const userId = getUserId(req);
      const response = await deps.upsertAutosaveDraft.execute({
        userId,
        title: input.title,
        items: input.items,
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/autosave", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      await deps.discardAutosaveDraft.execute(userId);

      res.status(204).end();
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

  router.patch("/:id/activate", async (req, res, next) => {
    try {
      const params = listParamsSchema.parse(req.params);
      const input = activateListSchema.parse(req.body);
      const userId = getUserId(req);
      const response = await deps.updateListStatus.execute({
        userId,
        listId: params.id,
        status: input.status,
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/complete", async (req, res, next) => {
    try {
      const params = listParamsSchema.parse(req.params);
      const input = completeListSchema.parse(req.body);
      const userId = getUserId(req);
      const response = await deps.completeList.execute({
        userId,
        listId: params.id,
        checkedItemIds: input.checkedItemIds,
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/reuse", async (req, res, next) => {
    try {
      const params = listParamsSchema.parse(req.params);
      const userId = getUserId(req);
      const response = await deps.reuseList.execute({
        userId,
        listId: params.id,
      });

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id/editing", async (req, res, next) => {
    try {
      const params = listParamsSchema.parse(req.params);
      const input = editingSchema.parse(req.body);
      const userId = getUserId(req);
      const response = await deps.startListEditing.execute({
        userId,
        listId: params.id,
        isEditing: input.isEditing,
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/finish-edit", async (req, res, next) => {
    try {
      const params = listParamsSchema.parse(req.params);
      const userId = getUserId(req);
      const response = await deps.finishListEdit.execute({
        userId,
        listId: params.id,
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const params = listParamsSchema.parse(req.params);
      const userId = getUserId(req);
      const response = await deps.deleteList.execute({
        userId,
        listId: params.id,
      });

      res.status(200).json(response);
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
      API_ERROR_MESSAGES.notAuthenticated,
    );
  }

  return authRequest.userId;
}
