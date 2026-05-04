import { describe, it, expect } from 'vitest';
import { rateLimit } from './rateLimit';

describe('rateLimit', () => {
  it('allows up to limit then blocks', () => {
    const key = `t-${Math.random()}`;
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('isolates keys', () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 60_000).ok).toBe(true);
    expect(rateLimit(a, 1, 60_000).ok).toBe(false);
    expect(rateLimit(b, 1, 60_000).ok).toBe(true);
  });
});
