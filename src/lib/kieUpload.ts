import axios from 'axios';

const KIE_UPLOAD_URL = 'https://kieai.redpandaai.co/api/file-base64-upload';

const getKieKey = () => {
  const k = process.env.KIE_API_KEY;
  if (!k) throw new Error('KIE_API_KEY env değişkeni tanımlı değil');
  return k;
};

export async function uploadToKie(base64DataUrl: string): Promise<string> {
  const match = base64DataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.*)$/);
  const ext = match ? match[1].replace('jpeg', 'jpg') : 'png';
  const rawBase64 = match ? match[2] : base64DataUrl;
  const uniqueName = `rq-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

  try {
    const res = await axios.post(
      KIE_UPLOAD_URL,
      { base64Data: rawBase64, fileName: uniqueName, uploadPath: 'images' },
      {
        headers: { Authorization: `Bearer ${getKieKey()}`, 'Content-Type': 'application/json' },
        timeout: 60_000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );
    // Kie response shape can vary: { code, msg, data: { downloadUrl } } or sometimes { data: { url } }
    const d = res.data?.data ?? {};
    const url =
      d.downloadUrl ||
      d.url ||
      d.fileUrl ||
      d.imageUrl ||
      (typeof res.data === 'string' && res.data.startsWith('http') ? res.data : '');
    if (!url) {
      const code = res.data?.code;
      const msg = res.data?.msg || res.data?.message || JSON.stringify(res.data).slice(0, 300);
      throw new Error(`Kie upload: code=${code} msg=${msg}`);
    }
    return url as string;
  } catch (e) {
    const err = e as { response?: { status?: number; data?: unknown }; message?: string; code?: string };
    if (err.response) {
      const body = err.response.data
        ? (typeof err.response.data === 'string'
            ? err.response.data.slice(0, 300)
            : JSON.stringify(err.response.data).slice(0, 300))
        : '';
      throw new Error(`Kie upload ${err.response.status}: ${body}`);
    }
    if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
      throw new Error(`Kie upload timeout: ${err.message}`);
    }
    throw new Error(`Kie upload: ${err.message || 'unknown error'}`);
  }
}

export async function ensureUrl(maybeBase64: string | null | undefined): Promise<string | null> {
  if (!maybeBase64) return null;
  if (maybeBase64.startsWith('data:image')) return uploadToKie(maybeBase64);
  return maybeBase64;
}
