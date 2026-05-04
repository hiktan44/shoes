const ALLOWED_MIME = new Set(['png', 'jpg', 'jpeg', 'webp']);

export function validateImageDataUrl(dataUrl: string, maxBytes: number): { ok: true } | { ok: false; reason: string } {
  const match = dataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.*)$/);
  if (!match) return { ok: false, reason: 'Geçersiz görsel formatı' };
  const mime = match[1].toLowerCase();
  if (!ALLOWED_MIME.has(mime)) return { ok: false, reason: `Desteklenmeyen format: ${mime}` };
  // base64 byte size = (length * 3) / 4 (eksi padding). Yaklaşık tahmin yeterli.
  const approxBytes = Math.floor((match[2].length * 3) / 4);
  if (approxBytes > maxBytes) {
    return { ok: false, reason: `Görsel çok büyük (${(approxBytes / 1024 / 1024).toFixed(1)} MB > ${(maxBytes / 1024 / 1024).toFixed(1)} MB)` };
  }
  return { ok: true };
}
