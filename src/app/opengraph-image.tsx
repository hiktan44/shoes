import { ImageResponse } from 'next/og';

export const alt = 'Fasheone Shoes — Ayakkabı markaları için AI görsel stüdyosu';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, color: 'white', background: 'linear-gradient(135deg, #09090b, #4f46e5)' }}>
      <div style={{ fontSize: 34, color: '#c7d2fe' }}>FASHEONE SHOES</div>
      <div style={{ marginTop: 28, fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>Ayakkabın için AI görsel stüdyosu</div>
      <div style={{ marginTop: 30, fontSize: 30, color: '#e4e4e7' }}>Satışa hazır ürün görselleri · Türkçe · Ürüne sadık</div>
    </div>,
    size,
  );
}
