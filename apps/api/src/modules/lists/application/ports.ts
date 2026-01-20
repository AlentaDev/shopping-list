import type { List } from "../domain/list.js";

export type ListRepository = {
  findById(id: string): Promise<List | null>;
  listByOwner(ownerUserId: string): Promise<List[]>;
  save(list: List): Promise<void>;
  deleteById(id: string): Promise<void>;
};

export type IdGenerator = {
  generate(): string;
};
