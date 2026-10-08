/** Only same-site absolute paths are allowed as post-login destinations (blocks "//host", "/\\host", "https://…", "javascript:…"). */
export function safeRedirect(next: string | null | undefined, fallback = "/"): string {
  if (!next || !/^\/(?![/\\])/.test(next) || /[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}
