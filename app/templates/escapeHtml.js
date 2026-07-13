/**
 * Escape user-controlled values before interpolating them into HTML emails.
 * Prevents HTML/markup injection (phishing) via attacker-set display names.
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
