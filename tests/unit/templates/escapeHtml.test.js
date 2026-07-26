import { describe, it, expect } from "vitest";
import { escapeHtml } from "../../../app/templates/escapeHtml.js";

describe("escapeHtml", () => {
  it("escapes all five HTML-sensitive characters", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("neutralises a script-injection attempt", () => {
    const raw = `<script>alert('xss')</script>`;
    const out = escapeHtml(raw);
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("escapes & first so entities are not double-broken", () => {
    // "&lt;" typed by an attacker must become "&amp;lt;", not "&lt;"
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("returns an empty string for null/undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("coerces non-string values to string", () => {
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml(0)).toBe("0");
    expect(escapeHtml(false)).toBe("false");
  });

  it("leaves safe text untouched", () => {
    expect(escapeHtml("Jean Dupont")).toBe("Jean Dupont");
  });
});
