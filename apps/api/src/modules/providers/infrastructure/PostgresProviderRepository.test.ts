import { describe, expect, it, vi } from "vitest";
import { PostgresProviderRepository } from "./PostgresProviderRepository.js";

describe("PostgresProviderRepository", () => {
  it("finds provider by slug", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [
          { id: "provider-1", slug: "mercadona", display_name: "Mercadona" },
        ],
      }),
    };

    const repository = new PostgresProviderRepository(pool);

    await expect(repository.findBySlug("mercadona")).resolves.toEqual({
      id: "provider-1",
      slug: "mercadona",
      displayName: "Mercadona",
    });

    expect(pool.query).toHaveBeenCalledWith(
      "SELECT id, slug, display_name FROM providers WHERE slug = $1",
      ["mercadona"],
    );
  });

  it("returns null when provider does not exist", async () => {
    const pool = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const repository = new PostgresProviderRepository(pool);

    await expect(repository.findBySlug("carrefour")).resolves.toBeNull();
  });
});
