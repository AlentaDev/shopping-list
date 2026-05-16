import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "@src/app/errors/errorMiddleware.js";
import { ListEditingLockedError } from "../application/errors.js";
import { createListsRouter } from "./router.js";

describe("lists router - complete list", () => {
  it("returns 409 when completing a list under editing lock", async () => {
    const completeListExecute = vi.fn().mockRejectedValue(new ListEditingLockedError());
    const app = express();
    app.use(express.json());
    app.use(
      "/api/lists",
      createListsRouter({
        createList: { execute: vi.fn() } as never,
        listLists: { execute: vi.fn() } as never,
        getList: { execute: vi.fn() } as never,
        deleteList: { execute: vi.fn() } as never,
        addCatalogItem: { execute: vi.fn() } as never,
        updateItem: { execute: vi.fn() } as never,
        removeItem: { execute: vi.fn() } as never,
        updateListStatus: { execute: vi.fn() } as never,
        completeList: { execute: completeListExecute } as never,
        reuseList: { execute: vi.fn() } as never,
        startListEditing: { execute: vi.fn() } as never,
        finishListEdit: { execute: vi.fn() } as never,
        getAutosaveDraft: { execute: vi.fn() } as never,
        resetAutosaveDraft: { execute: vi.fn() } as never,
        upsertAutosaveDraft: { execute: vi.fn() } as never,
        requireAuth: (req, _res, next) => {
          (req as { userId?: string }).userId = "user-1";
          next();
        },
      }),
    );
    app.use(errorMiddleware);

    const response = await request(app)
      .post("/api/lists/list-1/complete")
      .send({ checkedItemIds: [] });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: "list_editing_locked" });
    expect(completeListExecute).toHaveBeenCalledWith({
      userId: "user-1",
      listId: "list-1",
      checkedItemIds: [],
    });
  });
});
