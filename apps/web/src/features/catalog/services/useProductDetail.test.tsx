// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProductDetail } from "./CatalogService";
import { useProductDetail } from "./useProductDetail";
import type { CatalogProductDetail, CatalogProductSummary } from "./types";

vi.mock("./CatalogService", () => ({ getProductDetail: vi.fn() }));

const product: CatalogProductSummary = {
  id: "prod-1",
  name: "Manzanas Fuji",
  thumbnail: null,
  packaging: null,
  price: 1.2,
  unitSize: null,
  unitFormat: null,
  unitPrice: null,
  isApproxSize: false,
};
const detail: CatalogProductDetail = {
  id: "prod-1",
  name: "Manzanas Fuji",
  brand: null,
  origin: null,
  photos: [],
  description: null,
  usageInstructions: null,
  storageInstructions: null,
  ingredients: null,
  allergens: null,
};
const getProductDetailMock = vi.mocked(getProductDetail);

afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());

describe("useProductDetail", () => {
  it("stays idle without a selected product", () => {
    const { result } = renderHook(() => useProductDetail("mercadona", null));

    expect(result.current).toMatchObject({ detail: null, loading: false, error: null });
    expect(getProductDetailMock).not.toHaveBeenCalled();
  });

  it("loads the selected product detail", async () => {
    getProductDetailMock.mockResolvedValue(detail);
    const { result } = renderHook(() => useProductDetail("mercadona", product));

    expect(result.current).toMatchObject({ detail: null, loading: true, error: null });
    await waitFor(() => expect(result.current).toMatchObject({ detail, loading: false, error: null }));
    expect(getProductDetailMock).toHaveBeenCalledWith("mercadona", "prod-1");
  });

  it("shows a retryable error and retries the selected product", async () => {
    getProductDetailMock.mockRejectedValueOnce(new Error("network failure"));
    getProductDetailMock.mockResolvedValueOnce(detail);
    const { result } = renderHook(() => useProductDetail("mercadona", product));

    await waitFor(() => expect(result.current).toMatchObject({ detail: null, loading: false, error: expect.any(String) }));
    const firstError = result.current.error;
    act(() => result.current.retry());
    expect(result.current).toMatchObject({ detail: null, loading: true, error: null });
    await waitFor(() => expect(result.current).toMatchObject({ detail, loading: false, error: null }));
    expect(firstError).toBeTruthy();
    expect(getProductDetailMock).toHaveBeenCalledTimes(2);
  });

  it("clears a previously loaded detail from the current result", async () => {
    getProductDetailMock.mockResolvedValue(detail);
    const { result } = renderHook(() => useProductDetail("mercadona", product));

    await waitFor(() => expect(result.current.detail).toEqual(detail));
    act(() => result.current.clear());

    expect(result.current).toMatchObject({ detail: null, loading: true, error: null });
    expect(getProductDetailMock).toHaveBeenCalledOnce();
  });

  it("does not publish an older request error after selection changes", async () => {
    let rejectFirst!: (reason?: unknown) => void;
    getProductDetailMock
      .mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectFirst = reject; }))
      .mockResolvedValueOnce({ ...detail, id: "prod-2", name: "Otra fruta" });
    const otherProduct = { ...product, id: "prod-2", name: "Otra fruta" };
    const { result, rerender } = renderHook(
      ({ selected }: { selected: CatalogProductSummary }) => useProductDetail("mercadona", selected),
      { initialProps: { selected: product } },
    );

    rerender({ selected: otherProduct });
    await waitFor(() => expect(result.current.detail?.name).toBe("Otra fruta"));
    await act(async () => {
      rejectFirst(new Error("stale network failure"));
    });
    expect(result.current).toMatchObject({ detail: { name: "Otra fruta" }, loading: false, error: null });
  });

  it("does not publish an older product result after selection changes", async () => {
    let resolveFirst!: (value: CatalogProductDetail) => void;
    getProductDetailMock
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ ...detail, id: "prod-2", name: "Otra fruta" });
    const otherProduct = { ...product, id: "prod-2", name: "Otra fruta" };
    const { result, rerender } = renderHook(
      ({ selected }: { selected: CatalogProductSummary }) => useProductDetail("mercadona", selected),
      { initialProps: { selected: product } },
    );

    rerender({ selected: otherProduct });
    await waitFor(() => expect(result.current.detail?.name).toBe("Otra fruta"));
    await act(async () => {
      resolveFirst(detail);
    });
    expect(result.current.detail?.name).toBe("Otra fruta");
  });
});
