import type { SessionStore } from "../../shared/auth/sessionStore";
import { requireAuth } from "../../shared/web/requireAuth";
import { AddManualItem } from "./application/AddManualItem";
import { CreateList } from "./application/CreateList";
import { GetList } from "./application/GetList";
import { ListLists } from "./application/ListLists";
import { RemoveItem } from "./application/RemoveItem";
import { UpdateItem } from "./application/UpdateItem";
import type { IdGenerator, ListRepository } from "./application/ports";
import { InMemoryListRepository } from "./infrastructure/InMemoryListRepository";
import { RandomIdGenerator } from "./infrastructure/idGenerator";
import { createListsRouter } from "./web/router";

type ListsModuleDependencies = {
  sessionStore: SessionStore;
  listRepository?: ListRepository;
  idGenerator?: IdGenerator;
};

export function createListsModule(deps: ListsModuleDependencies) {
  const listRepository = deps.listRepository ?? new InMemoryListRepository();
  const idGenerator = deps.idGenerator ?? new RandomIdGenerator();

  const createList = new CreateList(listRepository, idGenerator);
  const listLists = new ListLists(listRepository);
  const getList = new GetList(listRepository);
  const addManualItem = new AddManualItem(listRepository, idGenerator);
  const updateItem = new UpdateItem(listRepository);
  const removeItem = new RemoveItem(listRepository);

  const router = createListsRouter({
    createList,
    listLists,
    getList,
    addManualItem,
    updateItem,
    removeItem,
    requireAuth: requireAuth(deps.sessionStore),
  });

  return { router };
}
