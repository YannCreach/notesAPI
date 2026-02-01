import { describe, it, expect, vi, beforeEach } from "vitest";
import PlacesService from "../../../app/services/places.service.js";
import Place from "../../../app/models/place.js";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("PlacesService", () => {
  it("delegates getAllByUserPaginated to Place model", async () => {
    vi.spyOn(Place, "findAllByUserPaginated").mockResolvedValue({
      items: [],
      count: 0,
    });
    const res = await PlacesService.getAllByUserPaginated("u1", {
      page: 1,
      limit: 10,
    });
    expect(res).toEqual({ items: [], count: 0 });
    expect(Place.findAllByUserPaginated).toHaveBeenCalledWith("u1", {
      page: 1,
      limit: 10,
    });
  });

  it("delegates getPlaceById", async () => {
    vi.spyOn(Place, "findByIdForUser").mockResolvedValue({ id: 1 });
    const res = await PlacesService.getPlaceById("u1", 1);
    expect(res).toEqual({ id: 1 });
  });
});
