import { describe, expect, it } from "vitest";
import { LIST_STATUS } from "@src/shared/domain/listStatus";
import {
  adaptListCollectionResponse,
  adaptListDetailResponse,
  adaptListStatusSummaryResponse,
  adaptListSummaryResponse,
} from "./ListAdapter";

describe("ListAdapter", () => {
  it("normalizes list collection payload", () => {
    const payload = {
      lists: [
        {
          id: "list-1",
          title: "Semanal",
          updatedAt: "2024-02-01T10:00:00.000Z",
          activatedAt: "2024-02-01T09:00:00.000Z",
          itemCount: 3,
          isEditing: false,
          status: LIST_STATUS.ACTIVE,
        },
      ],
    };

    expect(adaptListCollectionResponse(payload)).toEqual({
      lists: [
        {
          id: "list-1",
          title: "Semanal",
          updatedAt: "2024-02-01T10:00:00.000Z",
          activatedAt: "2024-02-01T09:00:00.000Z",
          itemCount: 3,
          isEditing: false,
          status: LIST_STATUS.ACTIVE,
        },
      ],
    });
  });

  it("falls back to an empty list collection when payload is missing", () => {
    expect(adaptListCollectionResponse({})).toEqual({ lists: [] });
  });

  it("defaults summary status to DRAFT when missing", () => {
    const payload = {
      lists: [
        {
          id: "list-1",
          title: "Semanal",
          updatedAt: "2024-02-01T10:00:00.000Z",
        },
      ],
    };

    expect(adaptListCollectionResponse(payload)).toEqual({
      lists: [
        {
          id: "list-1",
          title: "Semanal",
          updatedAt: "2024-02-01T10:00:00.000Z",
          activatedAt: null,
          itemCount: 0,
          isEditing: false,
          status: LIST_STATUS.DRAFT,
        },
      ],
    });
  });

  it("normalizes list summary payload", () => {
    const payload = {
      id: "list-3",
      title: "Caprichos",
      updatedAt: "2024-02-03T10:00:00.000Z",
      activatedAt: "2024-02-03T09:00:00.000Z",
      itemCount: 4,
      isEditing: false,
      status: LIST_STATUS.ACTIVE,
    };

    expect(adaptListSummaryResponse(payload)).toEqual({
      id: "list-3",
      title: "Caprichos",
      updatedAt: "2024-02-03T10:00:00.000Z",
      activatedAt: "2024-02-03T09:00:00.000Z",
      itemCount: 4,
      isEditing: false,
      status: LIST_STATUS.ACTIVE,
    });
  });

  it("normalizes list status summary payload", () => {
    const payload = {
      id: "list-4",
      status: LIST_STATUS.ACTIVE,
      updatedAt: "2024-02-04T10:00:00.000Z",
    };

    expect(adaptListStatusSummaryResponse(payload)).toEqual({
      id: "list-4",
      status: LIST_STATUS.ACTIVE,
      updatedAt: "2024-02-04T10:00:00.000Z",
    });
  });

  it("normalizes list detail payload", () => {
    const payload = {
      id: "list-2",
      title: "Cena",
      updatedAt: "2024-02-02T10:00:00.000Z",
      activatedAt: null,
      itemCount: 1,
      isEditing: true,
      status: LIST_STATUS.COMPLETED,
      items: [
        {
          id: "item-1",
          kind: "manual",
          name: "Pan",
          qty: 2,
          checked: true,
          updatedAt: "2024-02-02T10:00:00.000Z",
        },
      ],
    };

    expect(adaptListDetailResponse(payload)).toEqual({
      id: "list-2",
      title: "Cena",
      updatedAt: "2024-02-02T10:00:00.000Z",
      activatedAt: null,
      itemCount: 1,
      isEditing: true,
      status: LIST_STATUS.COMPLETED,
      items: [
        {
          id: "item-1",
          kind: "manual",
          name: "Pan",
          qty: 2,
          checked: true,
          updatedAt: "2024-02-02T10:00:00.000Z",
          note: undefined,
          thumbnail: null,
          price: null,
          unitSize: null,
          unitFormat: null,
          unitPrice: null,
          isApproxSize: false,
          source: undefined,
          sourceProductId: undefined,
        },
      ],
    });
  });

  it("falls back to empty detail defaults", () => {
    expect(adaptListDetailResponse({})).toEqual({
      id: "",
      title: "",
      updatedAt: "",
      activatedAt: null,
      itemCount: 0,
      isEditing: false,
      items: [],
      status: undefined,
    });
  });
});
