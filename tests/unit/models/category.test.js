import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => {
  const state = { result: { data: null, error: null }, builders: [] };
  const makeBuilder = () => {
    const calls = [];
    const b = { calls };
    for (const m of ["select", "eq", "maybeSingle"]) {
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

import Category from "../../../app/models/category.js";

const hasEq = (b, col, val) =>
  b.calls.some(([m, c, v]) => m === "eq" && c === col && v === val);

beforeEach(() => {
  h.state.result = { data: null, error: null };
  h.state.builders = [];
});

describe("Category model", () => {
  it("findOneByLabel scopes to user_id + label", async () => {
    h.state.result = { data: { id: 1, label: "Restaurant" }, error: null };
    const out = await Category.findOneByLabel("u1", "Restaurant");
    const b = h.state.builders[0];
    expect(b.table).toBe("category");
    expect(hasEq(b, "user_id", "u1")).toBe(true);
    expect(hasEq(b, "label", "Restaurant")).toBe(true);
    expect(out).toEqual({ id: 1, label: "Restaurant" });
  });

  it("existsForUser returns true when the category belongs to the user", async () => {
    h.state.result = { data: { id: 5 }, error: null };
    const out = await Category.existsForUser("u1", 5);
    expect(hasEq(h.state.builders[0], "user_id", "u1")).toBe(true);
    expect(out).toBe(true);
  });

  it("existsForUser returns false when nothing matches (foreign category)", async () => {
    h.state.result = { data: null, error: null };
    expect(await Category.existsForUser("u1", 999)).toBe(false);
  });

  it("propagates Supabase errors", async () => {
    h.state.result = { data: null, error: { message: "nope" } };
    await expect(Category.existsForUser("u1", 1)).rejects.toThrow("nope");
  });
});
