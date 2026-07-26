import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

const h = vi.hoisted(() => ({
  send: vi.fn().mockResolvedValue({}),
  get: vi.fn(),
}));

vi.mock("axios", () => ({ default: { get: h.get } }));
vi.mock("../../../app/s3.js", () => ({
  s3Client: { send: h.send },
  s3Bucket: "test-bucket",
}));
vi.mock("../../../app/models/place.js", () => ({
  default: {
    findExistingByLocation: vi.fn(),
    findMementoById: vi.fn(),
    deleteMemento: vi.fn().mockResolvedValue(undefined),
    findPlaceWithMementos: vi.fn(),
    updateCategory: vi.fn(),
    deletePlace: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("../../../app/models/index.js", () => ({
  Category: {
    existsForUser: vi.fn(),
    findOneByLabel: vi.fn(),
  },
  Place: {},
  Social: {},
}));

import placeController from "../../../app/controllers/placeController.js";
import Place from "../../../app/models/place.js";
import { Category } from "../../../app/models/index.js";

const REGION = "eu-west-3";
const PREFIX = `https://test-bucket.s3.${REGION}.amazonaws.com/`;

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (p) => ((res.body = p), res);
  res.set = () => res;
  return res;
}
function run(handler, req) {
  const res = mockRes();
  let err = null;
  return Promise.resolve(handler(req, res, (e) => (err = e))).then(() => ({ res, err }));
}
const auth = { payload: { sub: "u1" } };

beforeAll(() => {
  process.env.AWS_REGION = REGION;
});
beforeEach(() => {
  vi.clearAllMocks();
  h.send.mockResolvedValue({});
});

describe("placeController.deleteResource (S3 ownership control)", () => {
  it("400 for a URL outside our bucket", async () => {
    const { res } = await run(placeController.deleteResource, {
      auth,
      query: { url: "https://evil.com/x.jpg" },
    });
    expect(res.statusCode).toBe(400);
    expect(h.send).not.toHaveBeenCalled();
  });

  it("403 when the file belongs to another user", async () => {
    const { res } = await run(placeController.deleteResource, {
      auth,
      query: { url: `${PREFIX}place-covers/abc_someone-else.jpg` },
    });
    expect(res.statusCode).toBe(403);
    expect(h.send).not.toHaveBeenCalled();
  });

  it("200 and deletes when the file belongs to the caller", async () => {
    const { res } = await run(placeController.deleteResource, {
      auth,
      query: { url: `${PREFIX}place-covers/abc_u1.jpg` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ deleted: true });
    expect(h.send).toHaveBeenCalledTimes(1);
  });
});

describe("placeController.changeCategory (category ownership)", () => {
  it("400 when oldCatId/newCatId are missing", async () => {
    const { res } = await run(placeController.changeCategory, {
      auth,
      query: { oldCatId: "1" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("403 when one of the categories is not owned by the user", async () => {
    Category.existsForUser.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const { res } = await run(placeController.changeCategory, {
      auth,
      query: { oldCatId: "1", newCatId: "2" },
    });
    expect(res.statusCode).toBe(403);
    expect(Place.updateCategory).not.toHaveBeenCalled();
  });

  it("200 with the updated count when both categories are owned", async () => {
    Category.existsForUser.mockResolvedValue(true);
    Place.updateCategory.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const { res } = await run(placeController.changeCategory, {
      auth,
      query: { oldCatId: "1", newCatId: "2" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ updated: 3 });
    expect(Place.updateCategory).toHaveBeenCalledWith("u1", "1", "2");
  });
});

describe("placeController.deleteMemento", () => {
  it("404 when the memento is not found (or not owned)", async () => {
    Place.findMementoById.mockResolvedValue(null);
    const { res } = await run(placeController.deleteMemento, { auth, query: { id: "9" } });
    expect(res.statusCode).toBe(404);
    expect(Place.deleteMemento).not.toHaveBeenCalled();
  });

  it("200 and deletes the row (cover=null skips S3)", async () => {
    Place.findMementoById.mockResolvedValue({ id: 9, cover: null });
    const { res } = await run(placeController.deleteMemento, { auth, query: { id: "9" } });
    expect(res.statusCode).toBe(200);
    expect(h.send).not.toHaveBeenCalled();
    expect(Place.deleteMemento).toHaveBeenCalledWith("u1", "9");
  });

  it("deletes the S3 cover when it is a bucket URL", async () => {
    Place.findMementoById.mockResolvedValue({ id: 9, cover: `${PREFIX}memento-photos/x_u1.jpg` });
    const { res } = await run(placeController.deleteMemento, { auth, query: { id: "9" } });
    expect(res.statusCode).toBe(200);
    expect(h.send).toHaveBeenCalledTimes(1);
  });
});

describe("placeController.deletePlaceWithMementos", () => {
  it("404 when the place is not found", async () => {
    Place.findPlaceWithMementos.mockResolvedValue(null);
    const { res } = await run(placeController.deletePlaceWithMementos, { auth, query: { id: "5" } });
    expect(res.statusCode).toBe(404);
    expect(Place.deletePlace).not.toHaveBeenCalled();
  });

  it("deletes each memento cover + the place cover, then the rows", async () => {
    Place.findPlaceWithMementos.mockResolvedValue({
      id: 5,
      cover: `${PREFIX}place-covers/p_u1.jpg`,
      place_note: [
        { id: 1, cover: `${PREFIX}memento-photos/a_u1.jpg` },
        { id: 2, cover: null },
      ],
    });
    const { res } = await run(placeController.deletePlaceWithMementos, { auth, query: { id: "5" } });
    expect(res.statusCode).toBe(200);
    // one memento cover + one place cover = 2 S3 deletions (null skipped)
    expect(h.send).toHaveBeenCalledTimes(2);
    expect(Place.deletePlace).toHaveBeenCalledWith("u1", "5");
  });
});

describe("placeController uploads", () => {
  it("uploadPlaceCover 400 when no file is provided", async () => {
    const { res } = await run(placeController.uploadPlaceCover, { auth });
    expect(res.statusCode).toBe(400);
  });

  it("uploadPlaceCover 200 returns an S3 URL scoped by user id", async () => {
    const { res } = await run(placeController.uploadPlaceCover, {
      auth,
      file: { mimetype: "image/png", buffer: Buffer.from("x") },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.url).toContain("place-covers/");
    expect(res.body.url).toContain("_u1.png");
    expect(h.send).toHaveBeenCalledTimes(1);
  });

  it("uploadMementoPhoto 400 when no file is provided", async () => {
    const { res } = await run(placeController.uploadMementoPhoto, { auth });
    expect(res.statusCode).toBe(400);
  });
});

describe("placeController Google proxies", () => {
  it("getLocationExisting returns rows from the model", async () => {
    Place.findExistingByLocation.mockResolvedValue([{ id: 1 }]);
    const { res } = await run(placeController.getLocationExisting, {
      auth,
      query: { location: "paris" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ existingPlaces: [{ id: 1 }] });
  });

  it("getPlaceDetails proxies the Google result", async () => {
    h.get.mockResolvedValue({ data: { result: { name: "Café" } } });
    const { res } = await run(placeController.getPlaceDetails, {
      auth,
      query: { place_id: "abc" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ name: "Café" });
  });

  it("getPlaceDetails forwards axios errors to next()", async () => {
    h.get.mockRejectedValue(new Error("google down"));
    const { err } = await run(placeController.getPlaceDetails, {
      auth,
      query: { place_id: "abc" },
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("google down");
  });

  it("placeFromApiById maps Google data and resolves the category id", async () => {
    h.get.mockResolvedValue({
      data: {
        result: {
          name: "Le Resto",
          types: ["restaurant", "food"],
          geometry: { location: { lat: 1, lng: 2 } },
          place_id: "gid",
        },
      },
    });
    Category.findOneByLabel.mockResolvedValue({ id: 7 });

    const { res } = await run(placeController.placeFromApiById, {
      auth,
      query: { place_id: "gid" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Le Resto");
    expect(res.body.category_id).toBe(7);
    // category label derived from the first type, capitalised
    expect(Category.findOneByLabel).toHaveBeenCalledWith("u1", "Restaurant");
  });

  it("placeFromApiById sets category_id null when no matching category", async () => {
    h.get.mockResolvedValue({
      data: { result: { name: "X", types: ["bar"], geometry: {}, place_id: "g" } },
    });
    Category.findOneByLabel.mockResolvedValue(null);
    const { res } = await run(placeController.placeFromApiById, {
      auth,
      query: { place_id: "g" },
    });
    expect(res.body.category_id).toBeNull();
  });

  it("getLocationAutoComplete formats predictions with resolved geometry", async () => {
    h.get
      .mockResolvedValueOnce({
        data: {
          predictions: [
            {
              place_id: "p1",
              types: ["cafe"],
              structured_formatting: {
                main_text: "A",
                secondary_text: "B",
                main_text_matched_substrings: [],
              },
            },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { result: { geometry: { location: { lat: 1, lng: 2 } } } } });

    const { res } = await run(placeController.getLocationAutoComplete, {
      auth,
      query: { location: "caf" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.body[0].main_text).toBe("A");
    expect(res.body[0].place_id).toBe("p1");
    expect(res.body[0].location).toEqual({ lat: 1, lng: 2 });
  });
});
