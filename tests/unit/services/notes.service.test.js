import { describe, it, expect, vi, beforeEach } from "vitest";
import NotesService from "../../../app/services/notes.service.js";
import Note from "../../../app/models/note.js";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("NotesService", () => {
  it("delegates getAllByPlacePaginated to Note model", async () => {
    vi.spyOn(Note, "findAllByPlacePaginated").mockResolvedValue({
      items: [],
      count: 0,
    });
    const res = await NotesService.getAllByPlacePaginated("u1", 1, {
      page: 1,
      limit: 10,
    });
    expect(res).toEqual({ items: [], count: 0 });
    expect(Note.findAllByPlacePaginated).toHaveBeenCalledWith(1, "u1", {
      page: 1,
      limit: 10,
    });
  });

  it("delegates countByPlaceIds", async () => {
    vi.spyOn(Note, "countByPlaceIds").mockResolvedValue({ 1: 2 });
    const res = await NotesService.countByPlaceIds("u1", [1]);
    expect(res).toEqual({ 1: 2 });
  });

  it("delegates addTags to Note model", async () => {
    vi.spyOn(Note, "addTags").mockResolvedValue({
      tags: [{ id: 10, label: "spicy" }],
    });
    const res = await NotesService.addTags("u1", 5, [{ label: "spicy" }]);
    expect(res).toEqual({ tags: [{ id: 10, label: "spicy" }] });
    expect(Note.addTags).toHaveBeenCalledWith({
      userId: "u1",
      noteId: 5,
      tags: [{ label: "spicy" }],
    });
  });
});
