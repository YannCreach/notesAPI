import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  notFound,
  errorHandler,
} from "../../../app/middleware/errorHandler.js";

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
  res.send = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
}

describe("error middlewares", () => {
  let originalConsoleError;
  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });
  it("notFound returns 404", () => {
    const req = {};
    const res = mockRes();
    notFound(req, res);
    expect(res.statusCode).toBe(404);
    expect(res.body?.error?.code).toBe("not_found");
  });

  it("errorHandler returns 500 by default", () => {
    const err = new Error("boom");
    const req = {};
    const res = mockRes();
    errorHandler(err, req, res, () => {});
    expect(res.statusCode).toBe(500);
    expect(res.body?.error?.code).toBe("internal_error");
  });
});
