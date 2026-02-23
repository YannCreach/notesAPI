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

describe("noteController.createNote", () => {
  it("creates note and returns cover", async () => {
    const created = { id: 10, name: "memo", cover: "https://img.test/a.jpg" };
    const spy = vi.spyOn(NotesSvc.default, "create").mockResolvedValue(created);
    const req = {
      params: { id: "42" },
      validated: { name: "memo", cover: "https://img.test/a.jpg" },
      auth: { payload: { sub: "u1" } },
    };
    const res = mockRes();

    await noteController.createNote(req, res, () => {});

    expect(spy).toHaveBeenCalledWith("u1", "42", {
      name: "memo",
      cover: "https://img.test/a.jpg",
      favorite: undefined,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body?.note?.cover).toBe("https://img.test/a.jpg");
  });

  it("accepts legacy option and ignores it", async () => {
    const created = { id: 11, name: "memo", cover: null };
    const spy = vi.spyOn(NotesSvc.default, "create").mockResolvedValue(created);
    const req = {
      params: { id: "42" },
      validated: { name: "memo", option: "legacy value" },
      auth: { payload: { sub: "u1" } },
    };
    const res = mockRes();

    await noteController.createNote(req, res, () => {});

    expect(spy).toHaveBeenCalledWith("u1", "42", {
      name: "memo",
      price: undefined,
      cover: undefined,
      rating: undefined,
      comment: undefined,
      favorite: undefined,
    });
    expect(res.statusCode).toBe(201);
  });
});

describe("noteController.updateNote cover handling", () => {
  it("passes cover null to remove photo", async () => {
    const updated = { id: 1, cover: null };
    const spy = vi
      .spyOn(NotesSvc.default, "updateFields")
      .mockResolvedValue(updated);

    const req = {
      params: { id: 1 },
      validated: { cover: null },
      auth: { payload: { sub: "u1" } },
    };
    const res = mockRes();

    await noteController.updateNote(req, res, () => {});

    expect(spy).toHaveBeenCalledWith("u1", 1, { cover: null });
    expect(res.statusCode).toBe(200);
    expect(res.body?.note?.cover).toBe(null);
  });

  it("accepts legacy option-only payload and returns current note", async () => {
    const existing = { id: 1, user_id: "u1", cover: "https://img.test/x.jpg" };
    const updateSpy = vi.spyOn(NotesSvc.default, "updateFields");
    vi.spyOn(NotesSvc.default, "getById").mockResolvedValue(existing);
    const req = {
      params: { id: 1 },
      validated: { option: "legacy value" },
      auth: { payload: { sub: "u1" } },
    };
    const res = mockRes();

    await noteController.updateNote(req, res, () => {});

    expect(updateSpy).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body?.note).toEqual(existing);
  });
});
