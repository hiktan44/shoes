// Basit, in-memory IP başına sliding window rate-limit.
// Production'da Redis/Upstash'e taşınmalı; tek-instance Next deploy'lar için yeterli.

const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const arr = (buckets.get(key) || []).filter(t => t > cutoff);
  if (arr.length >= limit) {
    return { ok: false, retryAfterMs: arr[0] + windowMs - now };
  }
  arr.push(now);
  buckets.set(key, arr);
  return { ok: true, retryAfterMs: 0 };
}
