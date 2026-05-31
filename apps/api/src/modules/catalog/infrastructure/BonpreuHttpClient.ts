export class BonpreuHttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  getCategories<T>(): Promise<T> {
    return this.getJson<T>(
      "/api/webproductpagews/v1/categories?decoration=true&categoryDepth=3",
    );
  }

  getCategoryProducts<T>(
    categoryId: string,
    maxProductsToDecorate: number,
  ): Promise<T> {
    return this.getJson<T>(
      `/api/webproductpagews/v6/product-pages?categoryId=${encodeURIComponent(categoryId)}&includeAdditionalPageInfo=false&maxProductsToDecorate=${maxProductsToDecorate}`,
    );
  }

  searchProducts<T>(query: string, maxProductsToDecorate = 30): Promise<T> {
    return this.getJson<T>(
      `/api/webproductpagews/v6/product-pages/search?includeAdditionalPageInfo=false&maxProductsToDecorate=${maxProductsToDecorate}&q=${encodeURIComponent(query)}`,
    );
  }

  getProductDetail<T>(retailerProductId: string): Promise<T> {
    return this.getJson<T>(
      `/api/webproductpagews/v5/products/bop?retailerProductId=${encodeURIComponent(retailerProductId)}`,
    );
  }

  private async getJson<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "GET",
        signal: controller.signal,
        headers: {
          accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Bonpreu request failed with status ${response.status}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
