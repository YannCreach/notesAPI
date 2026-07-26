import { describe, it, expect, vi, beforeEach } from "vitest";

// Chainable Supabase mock: every builder method records its call and returns
// the same builder; awaiting the builder resolves to state.result.
const h = vi.hoisted(() => {
  const state = { result: { data: null, error: null }, builders: [] };
  const makeBuilder = () => {
    const calls = [];
    const b = { calls };
    for (const m of [
      "select", "insert", "update", "delete",
      "eq", "or", "in", "order", "maybeSingle", "single",
    ]) {
      b[m] = (...a) => (calls.push([m, ...a]), b);
    }
    b.then = (res, rej) => Promise.resolve(state.result).then(res, rej);
    return b;
  };
  const from = (table) => {
    const b = makeBuilder();
    b.table = table;
    state.builders.push(b);
    return b;
  };
  return { state, from };
});

vi.mock("../../../app/database.js", () => ({
  supabaseAdmin: { from: h.from },
  supabase: { from: h.from },
  default: { from: h.from },
}));

import Place from "../../../app/models/place.js";

const hasEq = (b, col, val) =>
  b.calls.some(([m, c, v]) => m === "eq" && c === col && v === val);
const called = (b, method) => b.calls.some(([m]) => m === method);

beforeEach(() => {
  h.state.result = { data: null, error: null };
  h.state.builders = [];
});

describe("Place model — user_id scoping (security invariant)", () => {
  it("findExistingByLocation scopes to user_id and returns rows", async () => {
    h.state.result = { data: [{ id: 1 }], error: null };
    const out = await Place.findExistingByLocation("u1", "paris");
    const b = h.state.builders[0];
    expect(b.table).toBe("place");
    expect(hasEq(b, "user_id", "u1")).toBe(true);
    expect(out).toEqual([{ id: 1 }]);
  });

  it("findExistingByLocation returns [] when data is null", async () => {
    h.state.result = { data: null, error: null };
    expect(await Place.findExistingByLocation("u1", "x")).toEqual([]);
  });

  it("findMementoById scopes to both user_id and id", async () => {
    h.state.result = { data: { id: 9 }, error: null };
    const out = await Place.findMementoById("u1", 9);
    const b = h.state.builders[0];
    expect(b.table).toBe("note");
    expect(hasEq(b, "user_id", "u1")).toBe(true);
    expect(hasEq(b, "id", 9)).toBe(true);
    expect(called(b, "maybeSingle")).toBe(true);
    expect(out).toEqual({ id: 9 });
  });

  it("deleteMemento issues a delete scoped to user_id and id", async () => {
    await Place.deleteMemento("u1", 9);
    const b = h.state.builders[0];
    expect(b.table).toBe("note");
    expect(called(b, "delete")).toBe(true);
    expect(hasEq(b, "user_id", "u1")).toBe(true);
    expect(hasEq(b, "id", 9)).toBe(true);
  });

  it("updateCategory scopes to user_id and the old category", async () => {
    h.state.result = { data: [{ id: 1 }, { id: 2 }], error: null };
    const out = await Place.updateCategory("u1", 3, 4);
    const b = h.state.builders[0];
    expect(called(b, "update")).toBe(true);
    expect(hasEq(b, "user_id", "u1")).toBe(true);
    expect(hasEq(b, "category_id", 3)).toBe(true);
    expect(out).toHaveLength(2);
  });

  it("deletePlace deletes notes AND place, both scoped to user_id", async () => {
    await Place.deletePlace("u1", 5);
    expect(h.state.builders).toHaveLength(2);
    const [notes, place] = h.state.builders;
    expect(notes.table).toBe("note");
    expect(hasEq(notes, "user_id", "u1")).toBe(true);
    expect(hasEq(notes, "place_id", 5)).toBe(true);
    expect(place.table).toBe("place");
    expect(hasEq(place, "user_id", "u1")).toBe(true);
    expect(hasEq(place, "id", 5)).toBe(true);
  });

  it("propagates a Supabase error as a thrown Error", async () => {
    h.state.result = { data: null, error: { message: "db down" } };
    await expect(Place.findMementoById("u1", 1)).rejects.toThrow("db down");
  });
});
