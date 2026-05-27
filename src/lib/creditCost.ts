// İstemci tarafı kredi maliyeti hesabı — sunucudaki gerçek düşüşlerle birebir.
// Sunucu: /api/generate (stage1) = 1 'studio'; her /api/generate/vibe = 1 'pose';
// album = 2; retouch = 1; analyze = 1.
export const COST = { studio: 1, pose: 1, album: 2, retouch: 1, analyze: 1 } as const;

// Stüdyo sayfası üretiminin toplam maliyeti.
// poses > 0 → çoklu poz: stage1 (1) + poz sayısı.
// poses = 0 → tek üretim: stage1 (1) + (vibe Stüdyo değilse +1 vibe aşaması).
export function studioCost(opts: { poses: number; vibe: string }): number {
  if (opts.poses > 0) return COST.studio + opts.poses * COST.pose;
  return COST.studio + (opts.vibe && opts.vibe !== 'Stüdyo' ? COST.pose : 0);
}
