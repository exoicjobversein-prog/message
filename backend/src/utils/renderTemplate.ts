/**
 * Replace every {{key}} in `body` with vars[key] (?? '').
 * Key is trimmed and case-sensitive.
 */
export function renderTemplate(
  body: string,
  vars: Record<string, unknown>
): string {
  return body.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, key: string) => {
    const v = vars[key.trim()];
    return v === undefined || v === null ? '' : String(v);
  });
}
