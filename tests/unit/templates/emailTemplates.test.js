import { describe, it, expect } from "vitest";
import { friendRequestEmailHtml } from "../../../app/templates/friendRequestEmail.js";
import { invitationEmailHtml } from "../../../app/templates/invitationEmail.js";

const templates = [
  ["friendRequestEmailHtml", friendRequestEmailHtml],
  ["invitationEmailHtml", invitationEmailHtml],
];

describe.each(templates)("%s", (_name, render) => {
  it("escapes an injected display name (no raw markup in output)", () => {
    const html = render({
      fromName: `<img src=x onerror=alert(1)>`,
      fromEmail: "attacker@evil.test",
    });
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("escapes an injected email when name is absent", () => {
    const html = render({
      fromName: null,
      fromEmail: `"><script>evil()</script>`,
    });
    expect(html).not.toContain("<script>evil()</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders the plain sender name for safe input", () => {
    const html = render({ fromName: "Alice", fromEmail: "alice@test.io" });
    expect(html).toContain("Alice");
    expect(html).toContain("alice@test.io");
  });

  it("omits the sub-line when only an email is provided", () => {
    const html = render({ fromName: null, fromEmail: "solo@test.io" });
    expect(html).toContain("solo@test.io");
  });
});
