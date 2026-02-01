import { describe, it, expect } from "vitest";
import { validate } from "../../../app/middleware/validate.js";
import { z } from "zod";

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

describe("validate middleware", () => {
  it("returns 400 on invalid payload", async () => {
    const schema = z.object({ name: z.string().min(1) });
    const mw = validate(schema, "body");
    const req = { body: { name: "" } };
    const res = mockRes();
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await mw(req, res, next);

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.body?.error?.code).toBe("validation_error");
  });

  it("passes through on valid payload and sets req.validated", async () => {
    const schema = z.object({ name: z.string().min(1) });
    const mw = validate(schema, "body");
    const req = { body: { name: "ok" } };
    const res = mockRes();
    const next = () => {};

    await mw(req, res, next);

    expect(req.validated).toEqual({ name: "ok" });
    expect(res.statusCode).toBe(200);
  });
});
