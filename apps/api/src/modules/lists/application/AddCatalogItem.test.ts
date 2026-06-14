import { AppError } from "@src/shared/errors/appError.js";
import { describe, expect, it, vi } from "vitest";
import type { CatalogProvider, CatalogProviderSlug } from "@src/modules/catalog/public.js";
import type { List } from "../domain/list.js";
import { InMemoryListRepository } from "../infrastructure/InMemoryListRepository.js";
import { AddCatalogItem } from "./AddCatalogItem.js";
import {
  DraftProviderConflictError,
  ListStatusTransitionError,
  ProviderPayloadContractError,
} from "./errors.js";

const createDraftList = (): List => ({
  id: "list-1",
  ownerUserId: "user-1",
  title: "Draft list",
  providerId: "provider-mercadona",
  isAutosaveDraft: true,
  status: "DRAFT",
  activatedAt: undefined,
  isEditing: false,
  items: [],
  createdAt: new Date("2024-01-01T10:00:00.000Z"),
  updatedAt: new Date("2024-01-01T10:00:00.000Z"),
});

function createCatalogProvider(slug: CatalogProviderSlug): CatalogProvider {
  return {
    metadata: {
      id: `provider-${slug}`,
      slug,
      displayName: slug === "mercadona" ? "Mercadona" : "BonpreuEsclat",
    },
    getProduct: vi.fn(async (productId: string) => ({
      id: productId,
      display_name: slug === "mercadona" ? "Leche" : "Iogurt",
      thumbnail: null,
      price: { amount: 1.5 },
      price_instructions: {
        unit_price: 1.5,
        bulk_price: 1.5,
      },
    })),
    getRootCategories: vi.fn(),
    getCategoryDetail: vi.fn(),
  };
}

function createCatalogProviderResolver(providers: CatalogProvider[]) {
  return {
    resolve: vi.fn((slug: string) => {
      const provider = providers.find((candidate) => candidate.metadata?.slug === slug);
      if (!provider) {
        throw new AppError(404, "provider_not_found", "Provider not found", {
          provider: slug,
        });
      }

      return provider;
    }),
  };
}

describe("AddCatalogItem", () => {
  it("throws when the list is completed", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    const catalogProviderResolver = createCatalogProviderResolver([mercadonaProvider]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );
    const list: List = {
      id: "list-1",
      ownerUserId: "user-1",
      title: "Done list",
      providerId: "provider-mercadona",
      isAutosaveDraft: false,
      status: "COMPLETED",
      activatedAt: undefined,
      isEditing: false,
      items: [],
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    };

    await listRepository.save(list);

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        provider: "mercadona",
        productId: "sku-1",
      }),
    ).rejects.toBeInstanceOf(ListStatusTransitionError);
    expect(mercadonaProvider.getProduct).not.toHaveBeenCalled();
  });

  it("persists level 1 category and level 2 subcategory from nested categories tree", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    vi.mocked(mercadonaProvider.getProduct).mockResolvedValue({
      id: "4706",
      display_name: "Leche",
      thumbnail: null,
      categories: [
        {
          id: 1,
          name: "Alimentación",
          level: 0,
          categories: [
            {
              id: 2,
              name: "Lácteos",
              level: 1,
              categories: [{ id: 3, name: "Leche", level: 2 }],
            },
          ],
        },
      ],
      price_instructions: {
        unit_price: 1.5,
        bulk_price: 1.5,
      },
    });
    const catalogProviderResolver = createCatalogProviderResolver([mercadonaProvider]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );
    const list = createDraftList();
    await listRepository.save(list);

    const result = await useCase.execute({
      userId: "user-1",
      listId: "list-1",
      provider: "mercadona",
      productId: "4706",
    });

    expect(result.categorySnapshot).toBe("Lácteos");
    expect(result.subcategorySnapshot).toBe("Leche");

    const persistedList = await listRepository.findById("list-1");
    expect(persistedList?.items[0]).toMatchObject({
      categorySnapshot: "Lácteos",
      subcategorySnapshot: "Leche",
    });
  });

  it("persists level 1 category and keeps subcategory null when level 2 is missing", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    vi.mocked(mercadonaProvider.getProduct).mockResolvedValue({
      id: "4706",
      display_name: "Leche",
      thumbnail: null,
      categories: [
        {
          id: 1,
          name: "Alimentación",
          level: 0,
          categories: [{ id: 2, name: "Lácteos", level: 1 }],
        },
      ],
      price_instructions: {
        unit_price: 1.5,
        bulk_price: 1.5,
      },
    });
    const catalogProviderResolver = createCatalogProviderResolver([mercadonaProvider]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );
    const list = createDraftList();
    await listRepository.save(list);

    const result = await useCase.execute({
      userId: "user-1",
      listId: "list-1",
      provider: "mercadona",
      productId: "4706",
    });

    expect(result.categorySnapshot).toBe("Lácteos");
    expect(result.subcategorySnapshot).toBeNull();
  });

  it("falls back to defensive category when snapshots are missing", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    vi.mocked(mercadonaProvider.getProduct).mockResolvedValue({
      id: "4706",
      display_name: "Leche",
      thumbnail: null,
      price_instructions: {
        unit_price: 1.5,
        bulk_price: 1.5,
      },
    });
    const catalogProviderResolver = createCatalogProviderResolver([mercadonaProvider]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );
    const list = createDraftList();
    await listRepository.save(list);

    const result = await useCase.execute({
      userId: "user-1",
      listId: "list-1",
      provider: "mercadona",
      productId: "4706",
    });

    expect(result.categorySnapshot).toBe("Sin categoría");
    expect(result.subcategorySnapshot).toBeNull();
  });

  it("accepts catalog mutations when provider is resolved from FK id", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    const catalogProviderResolver = createCatalogProviderResolver([mercadonaProvider]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );
    await listRepository.save(createDraftList());

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        provider: "mercadona",
        productId: "4706",
      }),
    ).resolves.toMatchObject({ id: "list-1:4706" });
  });

  it("returns deterministic 409 draft_provider_conflict payload for provider mismatch", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    const bonpreuProvider = createCatalogProvider("bonpreuesclat");
    const catalogProviderResolver = createCatalogProviderResolver([
      mercadonaProvider,
      bonpreuProvider,
    ]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );

    await listRepository.save({
      ...createDraftList(),
      providerId: "provider-mercadona",
      items: [
        {
          id: "list-1:111",
          listId: "list-1",
          kind: "catalog",
          source: "mercadona",
          sourceProductId: "111",
          nameSnapshot: "Item",
          thumbnailSnapshot: null,
          priceSnapshot: 1,
          unitSizeSnapshot: null,
          unitFormatSnapshot: null,
          unitPricePerUnitSnapshot: null,
          isApproxSizeSnapshot: false,
          categorySnapshot: "Lácteos",
          subcategorySnapshot: null,
          qty: 1,
          checked: false,
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
          updatedAt: new Date("2024-01-01T10:00:00.000Z"),
        },
      ],
    });

    const nowIso = "2024-01-01T10:00:00.000Z";
    const expectedActions = ["switch_and_clear", "keep_draft_provider"];

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        provider: "bonpreuesclat",
        productId: "4706",
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "draft_provider_conflict",
      details: {
        errorCode: "draft_provider_conflict",
        draftProvider: {
          id: "provider-mercadona",
          slug: "mercadona",
          displayName: "Mercadona",
        },
        requestedProvider: {
          id: "provider-bonpreuesclat",
          slug: "bonpreuesclat",
          displayName: "BonpreuEsclat",
        },
        allowedActions: expectedActions,
        draftSummary: {
          itemCount: 1,
          updatedAt: nowIso,
        },
      },
    });

    expect(mercadonaProvider.getProduct).not.toHaveBeenCalled();
    expect(bonpreuProvider.getProduct).not.toHaveBeenCalled();
  });

  it("uses the resolved bonpreu provider for bonpreu-owned drafts", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    const bonpreuProvider = createCatalogProvider("bonpreuesclat");
    const catalogProviderResolver = createCatalogProviderResolver([
      mercadonaProvider,
      bonpreuProvider,
    ]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );

    await listRepository.save({
      ...createDraftList(),
      providerId: "provider-bonpreuesclat",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        provider: "bonpreuesclat",
        productId: "bp-1",
      }),
    ).resolves.toMatchObject({
      id: "list-1:bp-1",
      source: "bonpreuesclat",
    });

    expect(bonpreuProvider.getProduct).toHaveBeenCalledWith("bp-1");
    expect(mercadonaProvider.getProduct).not.toHaveBeenCalled();
  });

  it("fails with provider_not_found when the persisted draft provider cannot be resolved", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    const catalogProviderResolver = createCatalogProviderResolver([mercadonaProvider]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );

    await listRepository.save({
      ...createDraftList(),
      providerId: "provider-unknown",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        provider: "mercadona",
        productId: "4706",
      }),
    ).rejects.toMatchObject({
      status: 404,
      code: "provider_not_found",
      details: { provider: "unknown" },
    });

    expect(mercadonaProvider.getProduct).not.toHaveBeenCalled();
  });

  it("treats missing list provider ownership as an explicit defect instead of falling back to mercadona", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    const catalogProviderResolver = createCatalogProviderResolver([mercadonaProvider]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );

    await listRepository.save({
      ...createDraftList(),
      providerId: undefined,
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        provider: "mercadona",
        productId: "4706",
      }),
    ).rejects.toMatchObject({
      status: 404,
      code: "provider_not_found",
      details: { provider: "missing_list_provider" },
    });

    expect(mercadonaProvider.getProduct).not.toHaveBeenCalled();
  });

  it("fails with provider_payload_contract_error when price.amount is missing and does not persist", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    vi.mocked(mercadonaProvider.getProduct).mockResolvedValue({
      id: "4706",
      display_name: "Leche",
      thumbnail: null,
      price_instructions: {
        unit_price: undefined,
        bulk_price: null,
      },
    });
    const catalogProviderResolver = createCatalogProviderResolver([mercadonaProvider]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );
    await listRepository.save(createDraftList());

    await expect(
      useCase.execute({
        userId: "user-1",
        listId: "list-1",
        provider: "mercadona",
        productId: "4706",
      }),
    ).rejects.toBeInstanceOf(ProviderPayloadContractError);

    const persistedList = await listRepository.findById("list-1");
    expect(persistedList?.items).toHaveLength(0);
  });

  it("maps categoryPath with 0 levels to fallback category", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    vi.mocked(mercadonaProvider.getProduct).mockResolvedValue({
      id: "4706",
      display_name: "Leche",
      thumbnail: null,
      categoryPath: [],
      price: { amount: 1.5 },
      price_instructions: { unit_price: 1.5, bulk_price: 1.5 },
    } as unknown as Awaited<ReturnType<CatalogProvider["getProduct"]>>);
    const catalogProviderResolver = createCatalogProviderResolver([mercadonaProvider]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );
    await listRepository.save(createDraftList());

    const result = await useCase.execute({ userId: "user-1", listId: "list-1", provider: "mercadona", productId: "4706" });
    expect(result.categorySnapshot).toBe("Sin categoría");
    expect(result.subcategorySnapshot).toBeNull();
  });

  it("maps categoryPath with 1 level to category only", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    vi.mocked(mercadonaProvider.getProduct).mockResolvedValue({
      id: "4706",
      display_name: "Leche",
      thumbnail: null,
      categoryPath: [{ id: "c1", name: "Lácteos" }],
      price: { amount: 1.5 },
      price_instructions: { unit_price: 1.5, bulk_price: 1.5 },
    } as unknown as Awaited<ReturnType<CatalogProvider["getProduct"]>>);
    const catalogProviderResolver = createCatalogProviderResolver([mercadonaProvider]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );
    await listRepository.save(createDraftList());

    const result = await useCase.execute({ userId: "user-1", listId: "list-1", provider: "mercadona", productId: "4706" });
    expect(result.categorySnapshot).toBe("Lácteos");
    expect(result.subcategorySnapshot).toBeNull();
  });

  it("maps categoryPath with 3 levels to level-2 category and level-3 subcategory", async () => {
    const listRepository = new InMemoryListRepository();
    const idGenerator = { generate: vi.fn().mockReturnValue("item-1") };
    const mercadonaProvider = createCatalogProvider("mercadona");
    vi.mocked(mercadonaProvider.getProduct).mockResolvedValue({
      id: "4706",
      display_name: "Leche",
      thumbnail: null,
      categoryPath: [
        { id: "c0", name: "Alimentación" },
        { id: "c1", name: "Lácteos" },
        { id: "c2", name: "Leche" },
      ],
      price: { amount: 1.5 },
      price_instructions: { unit_price: 1.5, bulk_price: 1.5 },
    } as unknown as Awaited<ReturnType<CatalogProvider["getProduct"]>>);
    const catalogProviderResolver = createCatalogProviderResolver([mercadonaProvider]);
    const useCase = new AddCatalogItem(
      listRepository,
      idGenerator,
      catalogProviderResolver,
    );
    await listRepository.save(createDraftList());

    const result = await useCase.execute({ userId: "user-1", listId: "list-1", provider: "mercadona", productId: "4706" });
    expect(result.categorySnapshot).toBe("Lácteos");
    expect(result.subcategorySnapshot).toBe("Leche");
  });
});
