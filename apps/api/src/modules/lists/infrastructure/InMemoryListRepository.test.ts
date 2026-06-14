import { describe, expect, it } from "vitest";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "./InMemoryListRepository.js";

const createList = (overrides: Partial<List> = {}): List => ({
  id: overrides.id ?? "list-1",
  ownerUserId: overrides.ownerUserId ?? "user-1",
  title: overrides.title ?? "Draft list",
  providerId: overrides.providerId,
  isAutosaveDraft: overrides.isAutosaveDraft ?? true,
  status: overrides.status ?? "DRAFT",
  activatedAt: overrides.activatedAt,
  isEditing: overrides.isEditing ?? false,
  editingTargetListId: overrides.editingTargetListId,
  items: overrides.items ?? [],
  createdAt: overrides.createdAt ?? new Date("2024-01-01T10:00:00.000Z"),
  updatedAt: overrides.updatedAt ?? new Date("2024-01-01T10:00:00.000Z"),
});

describe("InMemoryListRepository.backfillMissingProvider", () => {
  it("backfills only NULL, blank, and legacy mercadona ownership", async () => {
    const repository = new InMemoryListRepository();
    await repository.save(createList({ id: "missing", providerId: undefined }));
    await repository.save(createList({ id: "blank", providerId: "   " }));
    await repository.save(createList({ id: "legacy", providerId: "mercadona" }));
    await repository.save(
      createList({ id: "legacy-padded", providerId: "  mercadona  " }),
    );
    await repository.save(
      createList({ id: "bonpreu", providerId: "provider-bonpreuesclat" }),
    );

    await expect(
      repository.backfillMissingProvider("provider-mercadona"),
    ).resolves.toBe(4);

    await expect(repository.findById("missing")).resolves.toMatchObject({
      providerId: "provider-mercadona",
    });
    await expect(repository.findById("blank")).resolves.toMatchObject({
      providerId: "provider-mercadona",
    });
    await expect(repository.findById("legacy")).resolves.toMatchObject({
      providerId: "provider-mercadona",
    });
    await expect(repository.findById("legacy-padded")).resolves.toMatchObject({
      providerId: "provider-mercadona",
    });
    await expect(repository.findById("bonpreu")).resolves.toMatchObject({
      providerId: "provider-bonpreuesclat",
    });
  });
});
