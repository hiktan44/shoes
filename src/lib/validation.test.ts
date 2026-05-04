import { describe, it, expect } from 'vitest';
import { validateImageDataUrl } from './validation';

const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('validateImageDataUrl', () => {
  it('accepts a small PNG', () => {
    expect(validateImageDataUrl(tinyPng, 1_000_000)).toEqual({ ok: true });
  });

  it('rejects unknown MIME', () => {
    const r = validateImageDataUrl('data:image/tiff;base64,AAAA', 1_000_000);
    expect(r.ok).toBe(false);
  });

  it('rejects malformed data URL', () => {
    const r = validateImageDataUrl('not-a-data-url', 1_000_000);
    expect(r.ok).toBe(false);
  });

  it('enforces max size', () => {
    const big = 'data:image/png;base64,' + 'A'.repeat(2_000_000);
    const r = validateImageDataUrl(big, 1_000_000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/çok büyük/);
  });
});
