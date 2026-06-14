import { Router } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createCatalogModuleMock,
  createListsModuleMock,
  createAuthModuleMock,
  createUsersModuleMock,
  createPersistenceLayerMock,
} = vi.hoisted(() => ({
  createCatalogModuleMock: vi.fn(),
  createListsModuleMock: vi.fn(),
  createAuthModuleMock: vi.fn(),
  createUsersModuleMock: vi.fn(),
  createPersistenceLayerMock: vi.fn(),
}));

vi.mock("@src/modules/catalog/catalogModule.js", () => ({
  createCatalogModule: createCatalogModuleMock,
}));

vi.mock("@src/modules/lists/listsModule.js", () => ({
  createListsModule: createListsModuleMock,
}));

vi.mock("@src/modules/auth/authModule.js", () => ({
  createAuthModule: createAuthModuleMock,
}));

vi.mock("@src/modules/users/usersModule.js", () => ({
  createUsersModule: createUsersModuleMock,
}));

vi.mock("@src/app/persistence.js", () => ({
  createPersistenceLayer: createPersistenceLayerMock,
}));

import { buildRouter } from "./router.js";

describe("buildRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createPersistenceLayerMock.mockReturnValue({
      provider: "inmemory",
      userRepository: { findById: vi.fn() },
      listRepository: { findById: vi.fn(), listByOwner: vi.fn(), save: vi.fn(), deleteById: vi.fn() },
      refreshTokenStore: { save: vi.fn(), findValid: vi.fn(), revoke: vi.fn(), revokeFamily: vi.fn() },
    });
    createAuthModuleMock.mockReturnValue({
      router: Router(),
      userRepository: { findById: vi.fn() },
    });
    createUsersModuleMock.mockReturnValue({
      router: Router(),
      userRepository: { findById: vi.fn() },
    });
    createListsModuleMock.mockReturnValue({ router: Router() });
  });

  it("injects the catalog provider resolver into lists wiring", () => {
    const catalogProvider = { getProduct: vi.fn(), getRootCategories: vi.fn(), getCategoryDetail: vi.fn() };
    const catalogProviderResolver = { resolve: vi.fn() };
    createCatalogModuleMock.mockReturnValue({
      router: Router(),
      provider: catalogProvider,
      providerResolver: catalogProviderResolver,
      providers: [],
    });

    buildRouter();

    expect(createListsModuleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        catalogProviderResolver,
      }),
    );
    expect(createListsModuleMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        catalogProvider,
      }),
    );
  });
});
