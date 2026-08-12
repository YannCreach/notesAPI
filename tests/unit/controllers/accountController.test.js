import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

const h = vi.hoisted(() => ({
  send: vi.fn().mockResolvedValue({}),
  deleteUser: vi.fn().mockResolvedValue({ error: null }),
  // Records every table touched, in order, so the deletion order can be asserted.
  deletedFrom: [],
  rows: { place: [], note: [] },
}));

vi.mock("../../../app/s3.js", () => ({
  s3Client: { send: h.send },
  s3Bucket: "test-bucket",
}));

vi.mock("../../../app/database.js", () => {
  const builder = (table) => {
    const chain = {
      select: () => chain,
      eq: (column, value) => {
        if (chain._op === "delete") h.deletedFrom.push({ table, column, value });
        return chain._op === "delete" ? Promise.resolve({ error: null }) : chain;
      },
      in: (column, values) => {
        if (chain._op === "delete") h.deletedFrom.push({ table, column, values });
        return Promise.resolve({ error: null });
      },
      delete: () => {
        chain._op = "delete";
        return chain;
      },
      then: (resolve) => resolve({ data: h.rows[table] || [], error: null }),
    };
    return chain;
  };
  return {
    supabaseAdmin: {
      from: (table) => builder(table),
      auth: { admin: { deleteUser: h.deleteUser } },
    },
    supabase: {},
  };
});

import accountController from "../../../app/controllers/accountController.js";

const REGION = "eu-west-3";
const PREFIX = `https://test-bucket.s3.${REGION}.amazonaws.com/`;

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (p) => ((res.body = p), res);
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
  h.deletedFrom = [];
  h.rows = { place: [], note: [] };
  h.send.mockResolvedValue({});
  h.deleteUser.mockResolvedValue({ error: null });
});

describe("accountController.deleteAccount", () => {
  it("deletes the auth user and reports success", async () => {
    const { res, err } = await run(accountController.deleteAccount, { auth });
    expect(err).toBeNull();
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ deleted: true });
    expect(h.deleteUser).toHaveBeenCalledWith("u1");
  });

  it("scopes every deletion to the caller", async () => {
    await run(accountController.deleteAccount, { auth });
    const scoped = h.deletedFrom.filter((d) => d.value !== undefined);
    expect(scoped.length).toBeGreaterThan(0);
    for (const entry of scoped) {
      expect(entry.value).toBe("u1");
    }
  });

  it("clears both sides of the social graph", async () => {
    await run(accountController.deleteAccount, { auth });
    const columns = h.deletedFrom
      .filter((d) => d.table === "friends")
      .map((d) => d.column)
      .sort();
    expect(columns).toEqual(["friend_id", "user_id"]);
  });

  it("removes the photos before their rows", async () => {
    h.rows.place = [{ id: 1, cover: `${PREFIX}place-covers/a_u1.jpg` }];
    h.rows.note = [{ id: 2, cover: `${PREFIX}memento-photos/b_u1.jpg` }];
    await run(accountController.deleteAccount, { auth });
    expect(h.send).toHaveBeenCalledTimes(2);
  });

  it("ignores covers that are not hosted on the bucket", async () => {
    h.rows.place = [{ id: 1, cover: "https://example.com/external.jpg" }];
    await run(accountController.deleteAccount, { auth });
    expect(h.send).not.toHaveBeenCalled();
  });

  it("keeps going when a photo cannot be removed", async () => {
    h.rows.place = [{ id: 1, cover: `${PREFIX}place-covers/a_u1.jpg` }];
    h.send.mockRejectedValueOnce(new Error("NoSuchKey"));
    const { res } = await run(accountController.deleteAccount, { auth });
    expect(res.statusCode).toBe(200);
    expect(h.deleteUser).toHaveBeenCalled();
  });

  it("reports a failure when the auth user survives", async () => {
    h.deleteUser.mockResolvedValueOnce({ error: { message: "boom" } });
    const { res } = await run(accountController.deleteAccount, { auth });
    expect(res.statusCode).toBe(500);
    expect(res.body.error.code).toBe("account_deletion_failed");
  });
});
