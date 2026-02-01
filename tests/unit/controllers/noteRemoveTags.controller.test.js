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

describe("noteController.removeTags", () => {
  it("removes tags from a note and returns removed count", async () => {
    vi.spyOn(NotesSvc.default, "removeTags").mockResolvedValue({ removed: 2 });

    const req = {
      params: { id: 5 },
      validated: { tags: [{ label: "spicy" }, { label: "vegan" }] },
      auth: { payload: { sub: "u1" } },
    };
    const res = mockRes();

    await noteController.removeTags(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.removed).toBe(2);
  });
});
