/**
 * Sanitizes the OAuth `next` return path to prevent open redirects.
 * Only same-origin absolute paths are allowed.
 */
export function oauthReturnPath(next: string | null, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
