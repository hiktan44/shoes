import { NextResponse } from 'next/server';
import axios from 'axios';
import { rateLimit } from '@/lib/rateLimit';
import { validateImageDataUrl } from '@/lib/validation';
import { ensureUrl } from '@/lib/kieUpload';
import { EXPERT_PERSONA } from '@/lib/promptBuilder';
import { createClient } from '@/lib/supabase/server';

// Coolify'da function timeout yok, fakat Next.js / Node default body okuma sınırları geçerli
export const maxDuration = 120;

type AnalyzePayload = {
  imageUrl: string;
  shoeType?: string;
  language?: 'tr' | 'en';
};

type AnalyzeResult = {
  title: string;
  summary: string;
  highlights: string[];
  materials: { upper?: string; lining?: string; sole?: string; insole?: string };
  construction: string;
  color_palette: string[];
  size_run_suggestion: string;
  target_audience: string;
  use_cases: string[];
  care_instructions: string[];
  seo_keywords: string[];
  marketing_short: string;
  marketing_long: string;
  html_block: string;
};

function instructions(language: 'tr' | 'en', shoeType: string | undefined): string {
  const loc = language === 'en' ? 'English' : 'Turkish (Türkçe)';
  const typeHint = shoeType && shoeType !== 'Genel Ayakkabı' ? ` The product type is "${shoeType}".` : '';
  return `${EXPERT_PERSONA}
Analyze the provided shoe photograph and produce a detailed e-commerce product listing in ${loc}.${typeHint}
Output STRICT JSON only, matching this exact schema (no markdown fences, no commentary):
{
  "title": string,
  "summary": string,                 // 2-3 sentences
  "highlights": string[],            // 4-8 short bullet phrases
  "materials": { "upper": string, "lining": string, "sole": string, "insole": string },
  "construction": string,            // e.g. "Goodyear welted", "Cement", "Blake stitch", "Vulcanized", "unknown"
  "color_palette": string[],         // 2-5 hex codes you can SEE on the shoe, e.g. "#3a2b1f"
  "size_run_suggestion": string,     // e.g. "EU 36-42"
  "target_audience": string,
  "use_cases": string[],             // 3-6 contexts (work, casual, evening, hiking, etc.)
  "care_instructions": string[],     // 3-6 lines
  "seo_keywords": string[],          // 6-12 keywords
  "marketing_short": string,         // <= 160 chars, meta-description ready
  "marketing_long": string,          // 3-5 paragraphs, ready to paste into a product description
  "html_block": string               // self-contained HTML <section>...</section> ready to paste into an e-commerce description box
}
Be honest about uncertainty (use "unknown" if you cannot tell). Never invent SKUs, prices or brand names that aren't visible.`;
}

function axiosErrorMessage(prefix: string, e: unknown): string {
  const err = e as { code?: string; message?: string; response?: { status?: number; data?: unknown } };
  const status = err.response?.status;
  const body = err.response?.data;
  const bodySummary = body
    ? (typeof body === 'string'
        ? body.slice(0, 400)
        : JSON.stringify(body).slice(0, 400))
    : '';
  if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
    return `${prefix} timeout (${err.message || 'no message'})`;
  }
  return `${prefix} ${status ?? ''} ${err.message || ''} ${bodySummary}`.trim();
}

async function callOpenAI(imageUrl: string, language: 'tr' | 'en', shoeType?: string): Promise<AnalyzeResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OpenAI: OPENAI_API_KEY missing');
  const model = process.env.OPENAI_ANALYZE_MODEL || 'gpt-4o';
  const sys = instructions(language, shoeType);

  try {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sys },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this shoe and return the JSON described in the system message.' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      },
      {
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        timeout: 90_000,
      }
    );

    const txt = res.data?.choices?.[0]?.message?.content;
    if (!txt) throw new Error('OpenAI: empty response');
    return JSON.parse(txt) as AnalyzeResult;
  } catch (e) {
    throw new Error(axiosErrorMessage('OpenAI:', e));
  }
}

async function geminiCall(model: string, imageUrl: string, sys: string): Promise<AnalyzeResult> {
  const key = process.env.GEMINI_API_KEY!;

  let inlineData: { mimeType: string; data: string } | null = null;

  if (imageUrl.startsWith('data:')) {
    const m = imageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
    if (!m) throw new Error('Gemini: invalid data URL');
    inlineData = { mimeType: m[1], data: m[2] };
  } else {
    const r = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15_000 });
    const mime = (r.headers['content-type'] || 'image/jpeg').split(';')[0];
    const data = Buffer.from(r.data).toString('base64');
    inlineData = { mimeType: mime, data };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const parts: object[] = [
    { text: 'Analyze this shoe and return the JSON described in the system instruction.' },
    { inlineData },
  ];

  const res = await axios.post(
    url,
    {
      systemInstruction: { parts: [{ text: sys }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json' },
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 90_000 }
  );

  const txt = res.data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
  if (!txt) throw new Error('Gemini: empty response');
  return JSON.parse(txt) as AnalyzeResult;
}

async function callGemini(imageUrl: string, language: 'tr' | 'en', shoeType?: string): Promise<AnalyzeResult> {
  if (!process.env.GEMINI_API_KEY) throw new Error('Gemini: GEMINI_API_KEY missing');
  const sys = instructions(language, shoeType);
  const requested = process.env.GEMINI_ANALYZE_MODEL || 'gemini-2.5-pro';
  // Eğer kullanıcının istediği model 400/404 dönerse otomatik olarak stable modele düş
  const fallbacks = [requested, 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  const tried = new Set<string>();
  let lastErr: unknown = null;
  for (const m of fallbacks) {
    if (tried.has(m)) continue;
    tried.add(m);
    try {
      return await geminiCall(m, imageUrl, sys);
    } catch (e) {
      lastErr = e;
      const status = (e as { response?: { status?: number } }).response?.status;
      // Sadece 400/404 (model yok / desteklenmiyor) durumunda fallback'e geç
      if (status !== 400 && status !== 404) {
        throw new Error(axiosErrorMessage('Gemini:', e));
      }
    }
  }
  throw new Error(axiosErrorMessage('Gemini (all models failed):', lastErr));
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });

    const rl = rateLimit(`analyze:${user.id}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Çok fazla istek. ${Math.ceil(rl.retryAfterMs / 1000)} saniye sonra tekrar deneyin.` },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const body = (await request.json()) as AnalyzePayload;
    const { imageUrl, shoeType, language = 'tr' } = body;
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl gerekli' }, { status: 400 });

    if (imageUrl.startsWith('data:image')) {
      const v = validateImageDataUrl(imageUrl, parseInt(process.env.MAX_UPLOAD_BYTES || '8388608', 10));
      if (!v.ok) return NextResponse.json({ error: v.reason }, { status: 400 });
    }

    // OpenAI tercihen public bir URL bekliyor — data URL ise CDN'e yükle
    const hostedUrl = imageUrl.startsWith('data:') ? await ensureUrl(imageUrl) : imageUrl;
    if (!hostedUrl) return NextResponse.json({ error: 'Görsel yüklenemedi' }, { status: 500 });

    let provider: 'openai' | 'gemini' | null = null;
    let result: AnalyzeResult | null = null;
    let firstError: string | null = null;

    if (process.env.OPENAI_API_KEY) {
      try {
        result = await callOpenAI(hostedUrl, language, shoeType);
        provider = 'openai';
      } catch (e) {
        firstError = `OpenAI: ${(e as Error).message}`;
      }
    }

    if (!result && process.env.GEMINI_API_KEY) {
      try {
        // Gemini original imageUrl ile (data URL veya https) çalışabilir
        result = await callGemini(imageUrl, language, shoeType);
        provider = 'gemini';
      } catch (e) {
        const second = `Gemini: ${(e as Error).message}`;
        firstError = firstError ? `${firstError} | ${second}` : second;
      }
    }

    if (!result) {
      const msg = firstError || 'Hiçbir LLM sağlayıcısı yapılandırılmamış (OPENAI_API_KEY veya GEMINI_API_KEY gerekli)';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ provider, result });
  } catch (error: unknown) {
    const e = error as { response?: { data?: unknown }; message?: string };
    const msg = e?.message || 'Analiz Hatası';
    return NextResponse.json({ error: msg, detail: e?.response?.data ?? null }, { status: 500 });
  }
}
