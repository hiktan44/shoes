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

  const res = await axios.post(
    KIE_UPLOAD_URL,
    { base64Data: rawBase64, fileName: uniqueName, uploadPath: 'images' },
    { headers: { Authorization: `Bearer ${getKieKey()}`, 'Content-Type': 'application/json' } }
  );
  if (!res.data?.data?.downloadUrl) throw new Error('Upload failed');
  return res.data.data.downloadUrl as string;
}

export async function ensureUrl(maybeBase64: string | null | undefined): Promise<string | null> {
  if (!maybeBase64) return null;
  if (maybeBase64.startsWith('data:image')) return uploadToKie(maybeBase64);
  return maybeBase64;
}
