import { describe, it, expect, vi, beforeEach } from "vitest";
import * as NotesSvc from "../../../app/services/notes.service.js";
import noteController from "../../../app/controllers/noteController.js";

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

describe("noteController.updateNote rating parsing", () => {
  it("accepts decimal with dot", async () => {
    const updated = { id: 1, rating: 3.5 };
    const spy = vi
      .spyOn(NotesSvc.default, "updateFields")
      .mockResolvedValue(updated);

    const req = {
      params: { id: 1 },
      validated: { rating: "3.5" },
      auth: { payload: { sub: "u1" } },
    };
    const res = mockRes();

    await noteController.updateNote(req, res, () => {});

    expect(spy).toHaveBeenCalled();
    const passedUpdates = spy.mock.calls[0][2];
    expect(passedUpdates.rating).toBe(3.5);
    expect(res.statusCode).toBe(200);
    expect(res.body?.note?.rating).toBe(3.5);
  });

  it("accepts decimal with comma", async () => {
    const updated = { id: 1, rating: 4.2 };
    const spy = vi
      .spyOn(NotesSvc.default, "updateFields")
      .mockResolvedValue(updated);

    const req = {
      params: { id: 1 },
      validated: { rating: "4,2" },
      auth: { payload: { sub: "u1" } },
    };
    const res = mockRes();

    await noteController.updateNote(req, res, () => {});

    const passedUpdates = spy.mock.calls[0][2];
    expect(passedUpdates.rating).toBe(4.2);
    expect(res.statusCode).toBe(200);
  });

  it("accepts integer and converts to number", async () => {
    const updated = { id: 1, rating: 5 };
    const spy = vi
      .spyOn(NotesSvc.default, "updateFields")
      .mockResolvedValue(updated);

    const req = {
      params: { id: 1 },
      validated: { rating: 5 },
      auth: { payload: { sub: "u1" } },
    };
    const res = mockRes();

    await noteController.updateNote(req, res, () => {});

    const passedUpdates = spy.mock.calls[0][2];
    expect(passedUpdates.rating).toBe(5);
    expect(res.statusCode).toBe(200);
  });
});
