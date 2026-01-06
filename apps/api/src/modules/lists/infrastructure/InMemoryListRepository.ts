import type { ListRepository } from "../application/ports";
import type { List } from "../domain/list";

export class InMemoryListRepository implements ListRepository {
  private readonly lists = new Map<string, List>();

  async findById(id: string): Promise<List | null> {
    return this.lists.get(id) ?? null;
  }

  async listByOwner(ownerUserId: string): Promise<List[]> {
    return Array.from(this.lists.values()).filter(
      (list) => list.ownerUserId === ownerUserId
    );
  }

  async save(list: List): Promise<void> {
    this.lists.set(list.id, list);
  }
}
