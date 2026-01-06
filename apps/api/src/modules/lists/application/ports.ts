import type { List } from "../domain/list";

export type ListRepository = {
  findById(id: string): Promise<List | null>;
  listByOwner(ownerUserId: string): Promise<List[]>;
  save(list: List): Promise<void>;
};

export type IdGenerator = {
  generate(): string;
};
