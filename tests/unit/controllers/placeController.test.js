import { describe, it, expect, vi, beforeEach } from "vitest";
import * as PlacesSvc from "../../../app/services/places.service.js";
import * as NotesSvc from "../../../app/services/notes.service.js";
import placeController from "../../../app/controllers/placeController.js";

function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.body = null;
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("placeController.getAllPlaces", () => {
  it("returns paginated places with notes_count and meta", async () => {
    vi.spyOn(PlacesSvc.default, "getAllByUserPaginated").mockResolvedValue({
      items: [
        { id: 1, name: "p1" },
        { id: 2, name: "p2" },
      ],
      count: 2,
    });
    vi.spyOn(NotesSvc.default, "countByPlaceIds").mockResolvedValue({
      1: 3,
      2: 0,
    });

    const req = {
      validated: { page: 1, limit: 20, sort: "created_at", order: "desc" },
      auth: { payload: { sub: "u1" } },
    };
    const res = mockRes();

    await placeController.getAllPlaces(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.places?.[0]?.notes_count).toBe(3);
    expect(res.body?.meta?.total).toBe(2);
  });
});

describe("placeController.getPlacesByCategory", () => {
  it("returns paginated places with formatted data and meta", async () => {
    vi.spyOn(
      PlacesSvc.default,
      "getAllByCategoryLabelPaginated",
    ).mockResolvedValue({
      items: [
        {
          id: 1,
          name: "p1",
          address: "a",
          category_id: 1,
          rating: 4,
          slug: "s",
          favorite: false,
          googleid: null,
          yelpid: null,
        },
      ],
      count: 1,
    });
    vi.spyOn(NotesSvc.default, "countByPlaceIds").mockResolvedValue({ 1: 1 });

    const req = {
      query: { page: 1, limit: 10 },
      params: { categorylabel: "Restaurant" },
      auth: { payload: { sub: "u1" } },
    };
    const res = mockRes();

    await placeController.getPlacesByCategory(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.places?.[0]?.notes_count).toBe(1);
    expect(res.body?.meta?.totalPages).toBe(1);
  });
});
