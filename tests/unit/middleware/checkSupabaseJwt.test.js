import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Supabase client BEFORE importing the middleware (vi.mock is hoisted).
const h = vi.hoisted(() => ({
  getUser: vi.fn(),
}));
vi.mock("../../../app/database.js", () => ({
  supabase: { auth: { getUser: h.getUser } },
  supabaseAdmin: {},
  default: {},
}));

import { checkSupabaseJwt } from "../../../app/middleware/checkSupabaseJwt.js";

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (p) => ((res.body = p), res);
  return res;
}

beforeEach(() => {
  h.getUser.mockReset();
});

describe("checkSupabaseJwt", () => {
  it("401 when the Authorization header is missing", async () => {
    const req = { headers: {} };
    const res = mockRes();
    let nextCalled = false;
    await checkSupabaseJwt(req, res, () => (nextCalled = true));
    expect(res.statusCode).toBe(401);
    expect(res.body?.error?.code).toBe("unauthorized");
    expect(nextCalled).toBe(false);
    expect(h.getUser).not.toHaveBeenCalled();
  });

  it("401 when the scheme is not Bearer", async () => {
    const req = { headers: { authorization: "Basic abc" } };
    const res = mockRes();
    await checkSupabaseJwt(req, res, () => {});
    expect(res.statusCode).toBe(401);
    expect(h.getUser).not.toHaveBeenCalled();
  });

  it("401 when Supabase rejects the token", async () => {
    h.getUser.mockResolvedValue({ data: { user: null }, error: { message: "bad" } });
    const req = { headers: { authorization: "Bearer bad.token" } };
    const res = mockRes();
    await checkSupabaseJwt(req, res, () => {});
    expect(res.statusCode).toBe(401);
    expect(res.body?.error?.message).toBe("Invalid token");
  });

  it("populates req.auth and calls next on a valid token", async () => {
    h.getUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "u@test.io", user_metadata: { name: "U" } } },
      error: null,
    });
    const req = { headers: { authorization: "Bearer good.token" } };
    const res = mockRes();
    let nextCalled = false;
    await checkSupabaseJwt(req, res, () => (nextCalled = true));
    expect(nextCalled).toBe(true);
    expect(req.auth.token).toBe("good.token");
    expect(req.auth.payload).toEqual({ sub: "user-123", email: "u@test.io" });
    expect(req.auth.user.id).toBe("user-123");
  });

  it("forwards unexpected errors to next()", async () => {
    h.getUser.mockRejectedValue(new Error("network down"));
    const req = { headers: { authorization: "Bearer x" } };
    const res = mockRes();
    let forwarded = null;
    await checkSupabaseJwt(req, res, (e) => (forwarded = e));
    expect(forwarded).toBeInstanceOf(Error);
    expect(forwarded.message).toBe("network down");
  });
});
