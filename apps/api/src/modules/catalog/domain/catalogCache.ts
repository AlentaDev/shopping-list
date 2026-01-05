export type CatalogCache = {
  get<T>(key: string): T | null;
  getStale<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlMs: number): void;
};
