import { describe, it, expect, vi, beforeEach } from "vitest";

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

import Social from "../../../app/models/social.js";

const arg = (b, method) => b.calls.find(([m]) => m === method);
const hasEq = (b, col, val) =>
  b.calls.some(([m, c, v]) => m === "eq" && c === col && v === val);

beforeEach(() => {
  h.state.result = { data: null, error: null };
  h.state.builders = [];
});

describe("Social model", () => {
  it("findFriendship scopes to the requesting user's user_id + friend_id", async () => {
    h.state.result = { data: { id: 1 }, error: null };
    const out = await Social.findFriendship("u1", "u2");
    const b = h.state.builders[0];
    expect(b.table).toBe("friends");
    expect(hasEq(b, "user_id", "u1")).toBe(true);
    expect(hasEq(b, "friend_id", "u2")).toBe(true);
    expect(out).toEqual({ id: 1 });
  });

  it("findRequestById scopes to the recipient (to_user_id) — no cross-user accept", async () => {
    h.state.result = { data: { id: 7, from_user_id: "u9" }, error: null };
    await Social.findRequestById(7, "u1");
    const b = h.state.builders[0];
    expect(hasEq(b, "id", 7)).toBe(true);
    expect(hasEq(b, "to_user_id", "u1")).toBe(true);
  });

  it("deleteRequest is scoped to the recipient", async () => {
    await Social.deleteRequest(7, "u1");
    const b = h.state.builders[0];
    expect(b.calls.some(([m]) => m === "delete")).toBe(true);
    expect(hasEq(b, "id", 7)).toBe(true);
    expect(hasEq(b, "to_user_id", "u1")).toBe(true);
  });

  it("createFriendship inserts both directions of the relationship", async () => {
    await Social.createFriendship("u1", "u2");
    const [, rows] = arg(h.state.builders[0], "insert");
    expect(rows).toEqual([
      { user_id: "u1", friend_id: "u2" },
      { user_id: "u2", friend_id: "u1" },
    ]);
  });

  it("getFriends is scoped to the owner and returns [] when empty", async () => {
    h.state.result = { data: null, error: null };
    const out = await Social.getFriends("u1");
    expect(hasEq(h.state.builders[0], "user_id", "u1")).toBe(true);
    expect(out).toEqual([]);
  });

  it("getFriendPlaces flattens the notes_count aggregate", async () => {
    h.state.result = {
      data: [
        { id: 1, notes_count: [{ count: 3 }] },
        { id: 2, notes_count: [] },
      ],
      error: null,
    };
    const out = await Social.getFriendPlaces("friend1");
    expect(hasEq(h.state.builders[0], "user_id", "friend1")).toBe(true);
    expect(out[0].notes_count).toBe(3);
    expect(out[1].notes_count).toBe(0);
  });

  it("getFriendNotes scopes to both place_id and the friend's user_id", async () => {
    h.state.result = { data: [{ id: 1 }], error: null };
    await Social.getFriendNotes(42, "friend1");
    const b = h.state.builders[0];
    expect(b.table).toBe("note");
    expect(hasEq(b, "place_id", 42)).toBe(true);
    expect(hasEq(b, "user_id", "friend1")).toBe(true);
  });

  it("findPlaceByIdAndUser scopes to id + user_id", async () => {
    h.state.result = { data: { id: 42 }, error: null };
    await Social.findPlaceByIdAndUser(42, "friend1");
    const b = h.state.builders[0];
    expect(hasEq(b, "id", 42)).toBe(true);
    expect(hasEq(b, "user_id", "friend1")).toBe(true);
  });

  it("propagates Supabase errors", async () => {
    h.state.result = { data: null, error: { message: "boom" } };
    await expect(Social.findFriendship("u1", "u2")).rejects.toThrow("boom");
  });
});
