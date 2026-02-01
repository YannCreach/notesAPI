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

describe("noteController.getAllNotes", () => {
  it("returns paginated notes with meta", async () => {
    vi.spyOn(NotesSvc.default, "getAllByPlacePaginated").mockResolvedValue({
      items: [{ id: 1, name: "n1" }],
      count: 1,
    });

    const req = {
      validated: { page: 1, limit: 10, sort: "created_at", order: "desc" },
      params: { id: 42 },
      auth: { payload: { sub: "u1" } },
    };
    const res = mockRes();

    await noteController.getAllNotes(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.notes?.length).toBe(1);
    expect(res.body?.meta?.total).toBe(1);
  });
});
