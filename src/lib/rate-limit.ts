// Simple fixed-window rate limiter kept in memory.
// Limitation: on serverless hosting each instance has its own memory, so the real
// limit is "per instance". Good enough to slow down abuse in a demo; a production
// system would use a shared store (for example Redis).
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (windows.size > 5000) {
    windows.forEach((w, k) => {
      if (w.resetAt <= now) windows.delete(k);
    });
  }
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}
