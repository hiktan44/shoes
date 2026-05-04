import { describe, it, expect } from 'vitest';
import { pLimit } from './concurrency';

describe('pLimit', () => {
  it('runs at most N tasks concurrently', async () => {
    const limit = pLimit(2);
    let active = 0;
    let peak = 0;
    const task = (ms: number) => limit(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise(r => setTimeout(r, ms));
      active--;
      return ms;
    });
    const results = await Promise.all([task(20), task(20), task(20), task(20), task(20)]);
    expect(results).toEqual([20, 20, 20, 20, 20]);
    expect(peak).toBeLessThanOrEqual(2);
    expect(peak).toBeGreaterThan(0);
  });

  it('propagates errors without blocking the queue', async () => {
    const limit = pLimit(1);
    const ok = limit(async () => 'ok');
    const fail = limit(async () => { throw new Error('boom'); });
    const ok2 = limit(async () => 'ok2');
    expect(await ok).toBe('ok');
    await expect(fail).rejects.toThrow('boom');
    expect(await ok2).toBe('ok2');
  });
});
