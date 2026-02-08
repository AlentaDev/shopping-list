import { requireAuth } from "@src/shared/web/requireAuth.js";
import { AddCatalogItem } from "./application/AddCatalogItem.js";
import { CreateList } from "./application/CreateList.js";
import { GetList } from "./application/GetList.js";
import { ListLists } from "./application/ListLists.js";
import { DeleteList } from "./application/DeleteList.js";
import { RemoveItem } from "./application/RemoveItem.js";
import { UpdateItem } from "./application/UpdateItem.js";
import { UpdateListStatus } from "./application/UpdateListStatus.js";
import { GetAutosaveDraft } from "./application/GetAutosaveDraft.js";
import { DiscardAutosaveDraft } from "./application/DiscardAutosaveDraft.js";
import { CompleteList } from "./application/CompleteList.js";
import { ReuseList } from "./application/ReuseList.js";
import { StartListEditing } from "./application/StartListEditing.js";
import { UpsertAutosaveDraft } from "./application/UpsertAutosaveDraft.js";
import { FinishListEdit } from "./application/FinishListEdit.js";
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
  const addCatalogItem = new AddCatalogItem(
    listRepository,
    idGenerator,
    deps.catalogProvider,
  );
  const updateItem = new UpdateItem(listRepository);
  const removeItem = new RemoveItem(listRepository);
  const updateListStatus = new UpdateListStatus(listRepository);
  const completeList = new CompleteList(listRepository);
  const reuseList = new ReuseList(listRepository, idGenerator);
  const startListEditing = new StartListEditing(listRepository);
  const finishListEdit = new FinishListEdit(listRepository);
  const getAutosaveDraft = new GetAutosaveDraft(listRepository);
  const discardAutosaveDraft = new DiscardAutosaveDraft(listRepository);
  const upsertAutosaveDraft = new UpsertAutosaveDraft(
    listRepository,
    idGenerator,
  );

  const router = createListsRouter({
    createList,
    listLists,
    getList,
    deleteList,
    addCatalogItem,
    updateItem,
    removeItem,
    updateListStatus,
    completeList,
    reuseList,
    startListEditing,
    finishListEdit,
    getAutosaveDraft,
    discardAutosaveDraft,
    upsertAutosaveDraft,
    requireAuth: requireAuth(),
  });

  return { router };
}
