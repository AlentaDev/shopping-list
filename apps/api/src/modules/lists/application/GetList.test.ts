import { describe, expect, it } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { GetList } from "./GetList.js";

const createList = (overrides: Partial<List> = {}): List => ({
  id: "list-1",
  ownerUserId: "user-1",
  title: "Groceries",
  providerId: "provider-mercadona",
  isAutosaveDraft: false,
  status: "ACTIVE",
  activatedAt: new Date("2024-02-02T10:00:00.000Z"),
  isEditing: false,
  items: [],
  createdAt: new Date("2024-01-01T10:00:00.000Z"),
  updatedAt: new Date("2024-02-02T11:00:00.000Z"),
  ...overrides,
});

describe("GetList", () => {
  it("returns provider slug and displayName in detail response", async () => {
    const listRepository = new InMemoryListRepository();
    await listRepository.save(createList());
    const useCase = new GetList(listRepository);

    await expect(useCase.execute("user-1", "list-1")).resolves.toMatchObject({
      id: "list-1",
      providerId: "provider-mercadona",
      provider: {
        slug: "mercadona",
        displayName: "Mercadona",
      },
    });
  });

  it("falls back provider dto for legacy list without provider id", async () => {
    const listRepository = new InMemoryListRepository();
    await listRepository.save(
      createList({ providerId: undefined as unknown as string }),
    );
    const useCase = new GetList(listRepository);

    await expect(useCase.execute("user-1", "list-1")).resolves.toMatchObject({
      providerId: "provider-mercadona",
      provider: {
        slug: "mercadona",
        displayName: "Mercadona",
      },
    });
  });
});
