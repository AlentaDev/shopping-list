import type { ProviderRepository } from "../application/ports.js";
import type { Provider } from "../domain/provider.js";

type PgPool = {
  query: (
    text: string,
    params?: ReadonlyArray<unknown>,
  ) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

const PROVIDER_COLUMNS = "id, slug, display_name" as const;

export class PostgresProviderRepository implements ProviderRepository {
  constructor(private readonly pool: PgPool) {}

  async findBySlug(slug: string): Promise<Provider | null> {
    const result = await this.pool.query(
      `SELECT ${PROVIDER_COLUMNS} FROM providers WHERE slug = $1`,
      [slug],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapProviderRow(result.rows[0]);
  }
}

function mapProviderRow(row: Record<string, unknown>): Provider {
  return {
    id: String(row.id),
    slug: String(row.slug),
    displayName: String(row.display_name),
  };
}
