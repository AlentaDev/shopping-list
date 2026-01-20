import { requireAuth } from "@src/shared/web/requireAuth.js";
import { AddManualItem } from "./application/AddManualItem.js";
import { AddCatalogItem } from "./application/AddCatalogItem.js";
import { CreateList } from "./application/CreateList.js";
import { GetList } from "./application/GetList.js";
import { ListLists } from "./application/ListLists.js";
import { DeleteList } from "./application/DeleteList.js";
import { RemoveItem } from "./application/RemoveItem.js";
import { UpdateItem } from "./application/UpdateItem.js";
import { UpdateListStatus } from "./application/UpdateListStatus.js";
import type { CatalogProvider } from "@src/modules/catalog/public.js";
import type { IdGenerator, ListRepository } from "./application/ports.js";
import { InMemoryListRepository } from "./infrastructure/InMemoryListRepository.js";
import { RandomIdGenerator } from "./infrastructure/idGenerator.js";
import { createListsRouter } from "./api/router.js";

type ListsModuleDependencies = {
  catalogProvider: CatalogProvider;
  listRepository?: ListRepository;
  idGenerator?: IdGenerator;
};

export function createListsModule(deps: ListsModuleDependencies) {
  const listRepository = deps.listRepository ?? new InMemoryListRepository();
  const idGenerator = deps.idGenerator ?? new RandomIdGenerator();

  const createList = new CreateList(listRepository, idGenerator);
  const listLists = new ListLists(listRepository);
  const getList = new GetList(listRepository);
  const deleteList = new DeleteList(listRepository);
  const addManualItem = new AddManualItem(listRepository, idGenerator);
  const addCatalogItem = new AddCatalogItem(
    listRepository,
    idGenerator,
    deps.catalogProvider,
  );
  const updateItem = new UpdateItem(listRepository);
  const removeItem = new RemoveItem(listRepository);
  const updateListStatus = new UpdateListStatus(listRepository);

  const router = createListsRouter({
    createList,
    listLists,
    getList,
    deleteList,
    addManualItem,
    addCatalogItem,
    updateItem,
    removeItem,
    updateListStatus,
    requireAuth: requireAuth(),
  });

  return { router };
}
