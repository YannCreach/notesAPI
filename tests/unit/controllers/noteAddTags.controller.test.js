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

describe("noteController.addTags", () => {
  it("adds tags to a note and returns them", async () => {
    vi.spyOn(NotesSvc.default, "addTags").mockResolvedValue({
      tags: [{ id: 1, label: "spicy" }],
    });

    const req = {
      params: { id: 5 },
      validated: { tags: [{ label: "spicy" }] },
      auth: { payload: { sub: "u1" } },
    };
    const res = mockRes();

    await noteController.addTags(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.tags?.[0]?.label).toBe("spicy");
  });
});
