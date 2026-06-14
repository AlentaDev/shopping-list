import type { ListRepository } from "../application/ports.js";
import {
  resolveListProviderId,
  type List,
} from "../domain/list.js";

export class InMemoryListRepository implements ListRepository {
  private readonly lists = new Map<string, List>();

  async findById(id: string): Promise<List | null> {
    const list = this.lists.get(id);
    if (!list) {
      return null;
    }

    return { ...list };
  }

  async listByOwner(ownerUserId: string): Promise<List[]> {
    return Array.from(this.lists.values())
      .filter((list) => list.ownerUserId === ownerUserId)
      .map((list) => ({ ...list }));
  }

  async save(list: List): Promise<void> {
    this.lists.set(list.id, list);
  }

  async deleteById(id: string): Promise<void> {
    this.lists.delete(id);
  }

  async backfillMissingProvider(providerId: string): Promise<number> {
    const normalizedProviderId = resolveListProviderId(providerId);
    let updatedCount = 0;

    for (const list of this.lists.values()) {
      if (
        typeof list.providerId !== "string" ||
        list.providerId.trim().length === 0 ||
        list.providerId.trim() === "mercadona"
      ) {
        list.providerId = normalizedProviderId;
        updatedCount += 1;
      }
    }

    return updatedCount;
  }
}
