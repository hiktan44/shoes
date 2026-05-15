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

async function callOpenRouter(imageUrl: string, language: 'tr' | 'en', shoeType?: string): Promise<AnalyzeResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OpenRouter: OPENROUTER_API_KEY missing');
  const sys = instructions(language, shoeType);

  const primary = process.env.OPENROUTER_MODEL || 'openai/gpt-5.5';
  const fallback = process.env.OPENROUTER_FALLBACK_MODEL || 'google/gemini-3.1-pro-preview';
  // Ek hızlı/ucuz Gemini seçenekleri — pahalı modeller fail ederse devreye girer
  const extras = [
    'google/gemini-3.1-flash-lite',
    'google/gemini-3.1-flash-preview',
  ];
  const safety = ['openai/gpt-4o', 'google/gemini-2.5-pro'];
  const chain = [primary, fallback, ...extras, ...safety];

  let lastErr: unknown = null;
  const tried = new Set<string>();
  for (const model of chain) {
    if (!model || tried.has(model)) continue;
    tried.add(model);
    try {
      const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
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
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://fasheone-shoes',
            'X-Title': 'Fasheone Shoes',
          },
          timeout: 90_000,
        }
      );
      const txt = res.data?.choices?.[0]?.message?.content;
      if (!txt) throw new Error(`OpenRouter (${model}): empty response`);
      return JSON.parse(txt) as AnalyzeResult;
    } catch (e) {
      lastErr = e;
      const status = (e as { response?: { status?: number } }).response?.status;
      // 4xx model bulunamadı / param hatası → fallback'e devam et; 5xx ve timeout → da devam
      if (status && status < 400) throw new Error(axiosErrorMessage(`OpenRouter(${model}):`, e));
    }
  }
  throw new Error(axiosErrorMessage('OpenRouter (all models failed):', lastErr));
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

async function openAICall(model: string, imageUrl: string, sys: string): Promise<AnalyzeResult> {
  const key = process.env.OPENAI_API_KEY!;
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
  if (!txt) throw new Error(`OpenAI (${model}): empty response`);
  return JSON.parse(txt) as AnalyzeResult;
}

async function callOpenAI(imageUrl: string, language: 'tr' | 'en', shoeType?: string): Promise<AnalyzeResult> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI: OPENAI_API_KEY missing');
  const sys = instructions(language, shoeType);
  const requested = process.env.OPENAI_ANALYZE_MODEL || 'gpt-5.5';
  // Kullanıcı modeli 400/404 dönerse stable modele düş
  const fallbacks = [requested, 'gpt-5.5-pro', 'gpt-5.5', 'gpt-4o'];
  const tried = new Set<string>();
  let lastErr: unknown = null;
  for (const m of fallbacks) {
    if (!m || tried.has(m)) continue;
    tried.add(m);
    try {
      return await openAICall(m, imageUrl, sys);
    } catch (e) {
      lastErr = e;
      const status = (e as { response?: { status?: number } }).response?.status;
      if (status !== 400 && status !== 404) {
        throw new Error(axiosErrorMessage(`OpenAI(${m}):`, e));
      }
    }
  }
  throw new Error(axiosErrorMessage('OpenAI (all models failed):', lastErr));
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
  const requested = process.env.GEMINI_ANALYZE_MODEL || 'gemini-3.1-pro-preview';
  // Eğer kullanıcının istediği model 400/404 dönerse otomatik olarak stable modele düş
  const fallbacks = [requested, 'gemini-3.1-flash-preview', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-1.5-pro'];
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

    let provider: 'openrouter' | 'openai' | 'gemini' | null = null;
    let result: AnalyzeResult | null = null;
    const errors: string[] = [];

    // 1) OpenRouter (varsa) — kullanıcının verdiği OPENROUTER_MODEL'i + fallback chain'i dener
    if (process.env.OPENROUTER_API_KEY) {
      try {
        result = await callOpenRouter(hostedUrl, language, shoeType);
        provider = 'openrouter';
      } catch (e) {
        errors.push((e as Error).message);
      }
    }

    // 2) OpenAI direct (key varsa)
    if (!result && process.env.OPENAI_API_KEY) {
      try {
        result = await callOpenAI(hostedUrl, language, shoeType);
        provider = 'openai';
      } catch (e) {
        errors.push((e as Error).message);
      }
    }

    // 3) Gemini direct (key varsa)
    if (!result && process.env.GEMINI_API_KEY) {
      try {
        result = await callGemini(imageUrl, language, shoeType);
        provider = 'gemini';
      } catch (e) {
        errors.push((e as Error).message);
      }
    }

    if (!result) {
      const msg = errors.length
        ? errors.join(' | ')
        : 'Hiçbir LLM sağlayıcısı yapılandırılmamış (OPENROUTER_API_KEY, OPENAI_API_KEY veya GEMINI_API_KEY gerekli)';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ provider, result });
  } catch (error: unknown) {
    const e = error as { response?: { data?: unknown }; message?: string };
    const msg = e?.message || 'Analiz Hatası';
    return NextResponse.json({ error: msg, detail: e?.response?.data ?? null }, { status: 500 });
  }
}
