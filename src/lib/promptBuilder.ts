export const SHOE_NEGATIVE_PROMPT = "blurry, deformed, plastic, fake, extra laces, wrong proportions, missing eyelets, distorted sole, mangled textures, unnatural shape, extra stitches, weird logos, ugly background, two identical clones instead of a properly mirrored pair, redesigned shoe, recolored shoe, restyled shoe, different shoe model than reference, fantasy footwear, AI-hallucinated details on the shoe";

// Sistem-seviyesi direktifler — her modele giden promptun başına eklenir
export const EXPERT_PERSONA =
  'You are a master cobbler and luxury-footwear photographer with 30+ years of hands-on experience in shoe construction, leather work, last shapes, sole assemblies, stitching methods and high-end e-commerce photography. Treat every shoe with surgeon-level precision. Your professional reputation depends on reproducing the reference footwear with absolute fidelity.';

export const ENGLISH_DIRECTIVE =
  'All instructions, scene descriptions and downstream image-model commands are expressed in English. If any user-supplied note is in another language, internally translate it and execute the visual intent in English.';

export const PAIR_DIRECTIVE =
  'PAIR COMPLETION RULE: carefully inspect the reference image. If it shows ONLY ONE shoe (left OR right alone), you MUST reconstruct the missing mirror counterpart with anatomically correct left/right asymmetry — branding placement, buckle/lace direction, sole arch curvature, tongue lean and any side-specific detail must mirror correctly so the result is a believable matched pair of the same exact model. NEVER output two identical clone shoes when a true mirrored pair is required. If the reference already contains a complete pair, render that pair unchanged.';

export const ZERO_CHANGE_DIRECTIVE =
  'ABSOLUTE PRESERVATION: the reference shoe MUST appear in the output 1:1 — identical color hex values, leather grain, stitching pattern and density, eyelet count and placement, lace pattern and color, sole tread, heel height and pitch, toe shape, branding/logo position, hardware, scuffs and finish gloss. ZERO redesign, ZERO color shift, ZERO proportion change, ZERO style reinterpretation, ZERO added or removed details. If you are uncertain about any detail, copy the reference more literally — never invent.';

export const SYSTEM_PREAMBLE = [EXPERT_PERSONA, ENGLISH_DIRECTIVE, PAIR_DIRECTIVE, ZERO_CHANGE_DIRECTIVE].join(' ');

// Vibe Prompts (English)
const VIBE_PROMPTS: Record<string, string> = {
  "Stüdyo": "flawless white infinity background, commercial product photography, studio lighting, hyper-realistic, 8k, ultra-detailed fabric, crisp edges",
  "Albüm": "creative editorial footwear layout collage, multiple angles of the same shoe in one frame scattered aesthetically. one standing, one resting horizontally, divided sections, clean high-fashion magazine layout, soft shadows, 8k",
  "Oturma": "a stylish female model SEATED on a mid-century modern armchair or sofa, wearing the exact provided shoes, FEET FIRMLY ON THE FLOOR (not on the seat). Vary the pose naturally: sometimes both feet flat side-by-side, sometimes legs crossed (one knee over the other), sometimes one ankle resting on the opposite knee, sometimes legs angled to one side. Frame from chest or waist down so the FACE IS NOT VISIBLE — crop the head out of frame. Elegant lifestyle indoor setting, warm cinematic lighting, fashion editorial vibe, shoes are the hero of the shot, sharp focus on footwear.",
  "Ayakta": "a stylish female model STANDING, wearing the exact provided shoes, full body framed FROM THE WAIST DOWN — head and upper body cropped out, face not visible. Vary the pose naturally across shots: sometimes both feet planted together, sometimes one foot forward in a walking step, sometimes weight shifted to one leg with the other relaxed, sometimes legs slightly crossed in a contrapposto stance, sometimes a candid mid-stride. Editorial street/studio floor, soft directional lighting, sharp focus on footwear, shoes are the hero of the shot, fashion lookbook vibe.",
  "Sokak": "urban streetwear fashion, shoe placed on wet asphalt with neon reflections, dynamic angle, gritty night street vibe, extremely realistic",
  "Lüks": "minimalist beige marble pedestal, soft diffused sunlight from a large window, cinematic soft shadows, neutral warm tones, high-end editorial vibe",
};

const RANDOM_ELEMENTS = [
  "subtle warm key light, slight gradient background",
  "dramatic cool moody lighting, sharp shadows",
  "soft morning daylight, bright and airy feel",
  "vibrant cinematic rim lighting, deep contrast",
  "geometric shadow cast from an unseen window",
  "minimalist abstract props blurred in the background",
  "shallow depth of field with beautiful ethereal bokeh",
  "neon undertones with a moody commercial vibe",
];

// 8-poz kataloğu — kullanıcı çoklu seçer, hepsi aynı model & aynı kıyafet
export const POSE_CATALOG: Record<string, { label: string; desc: string; icon: string; faceVisible: boolean; aspect: string; prompt: string }> = {
  'koltuk-bel-alti': {
    label: 'Koltukta Oturan',
    desc: 'Ayaklar yerde, belden aşağı, yüz yok',
    icon: '🛋️',
    faceVisible: false,
    aspect: '3:4',
    prompt: 'the model SEATED on a mid-century modern armchair, both feet firmly on the floor side-by-side or with one ankle resting on the opposite knee, framed FROM THE CHEST DOWN — head and face cropped out of frame, warm cinematic indoor lighting, fashion editorial vibe, sharp focus on footwear',
  },
  'sandalye-bacakbacak': {
    label: 'Sandalyede Bacak Bacak Üstü',
    desc: 'Bacak bacak üstüne, belden aşağı, yüz yok',
    icon: '🪑',
    faceVisible: false,
    aspect: '3:4',
    prompt: 'the model SEATED on a designer chair with legs crossed (one knee elegantly over the other), shoes prominently displayed, framed FROM THE WAIST DOWN — face NOT visible, soft directional studio light, neutral background, magazine editorial style',
  },
  'studyo-ayakta-bel-alti': {
    label: 'Stüdyoda Ayakta',
    desc: 'Düz duruş, belden aşağı, yüz yok',
    icon: '🧍‍♀️',
    faceVisible: false,
    aspect: '3:4',
    prompt: 'the model STANDING in a clean photography studio, both feet planted on a seamless cyclorama floor, contrapposto stance with weight on one leg, framed FROM THE WAIST DOWN — head out of frame, soft beauty-dish lighting, fashion lookbook vibe',
  },
  'sokak-yuruyus': {
    label: 'Sokakta Yürürken',
    desc: 'Mid-stride, belden aşağı, yüz yok',
    icon: '🚶‍♀️',
    faceVisible: false,
    aspect: '3:4',
    prompt: 'the model captured MID-STRIDE walking on a city sidewalk, one foot lifted in motion the other planted, candid editorial street photography, framed FROM THE WAIST DOWN — face NOT visible, natural daylight with shallow depth of field, urban backdrop blurred',
  },
  'bank-park': {
    label: 'Park Bankında',
    desc: 'Bankta oturan, belden aşağı, yüz yok',
    icon: '🪵',
    faceVisible: false,
    aspect: '3:4',
    prompt: 'the model SEATED on a wooden park bench, feet flat on stone path or grass, ankles crossed gracefully or one foot forward, framed FROM THE WAIST DOWN — head out of frame, golden-hour outdoor light, gentle bokeh of greenery behind',
  },
  'studyo-tam-vucut-yuz': {
    label: 'Stüdyoda Tam Boy (Yüz Var)',
    desc: 'Tam vücut, yüz görünür, ayakkabı odak',
    icon: '📸',
    faceVisible: true,
    aspect: '3:4',
    prompt: 'a FULL-BODY editorial portrait of the model standing in a clean photography studio, FACE FULLY VISIBLE looking at camera or three-quarter view, confident relaxed pose, wide-leg or contrapposto stance making the shoes the visual anchor, soft beauty lighting, white seamless background, high-fashion lookbook composition with the FOOTWEAR AS THE FOCAL POINT',
  },
  'koltuk-tamboy-yuz': {
    label: 'Koltukta Tam Boy (Yüz Var)',
    desc: 'Lounge poz, yüz görünür, ayakkabı odak',
    icon: '🛋️',
    faceVisible: true,
    aspect: '3:4',
    prompt: 'a FULL-BODY lifestyle portrait of the model lounging elegantly on a luxurious sofa, FACE FULLY VISIBLE, body angled so shoes are prominently displayed (legs extended or crossed toward camera), warm cinematic interior lighting, designer apartment setting, magazine cover composition with the FOOTWEAR AS THE FOCAL POINT',
  },
  'sokak-tam-yuz': {
    label: 'Sokak Editoryalı (Yüz Var)',
    desc: 'Tam boy şehir, yüz görünür, ayakkabı odak',
    icon: '🌆',
    faceVisible: true,
    aspect: '3:4',
    prompt: 'a FULL-BODY street-style editorial of the model standing on an urban sidewalk, FACE FULLY VISIBLE with confident expression, dynamic pose with one foot forward, natural daylight, blurred city backdrop, low camera angle so the shoes feel grounded and prominent, fashion week vibes with the FOOTWEAR AS THE FOCAL POINT',
  },
};

// Tüm pozlarda model & kıyafet sabit kalsın diye kullanılan stabilizasyon promptu
export function buildCharacterAnchor(): string {
  return 'CHARACTER LOCK: the same single fashion model across every shot — long natural medium-brown hair down past the shoulders, minimal natural makeup, fair-medium skin tone, slim build. WARDROBE LOCK: identical outfit across every shot — a fitted cream cropped knit top with subtle ribbed texture and high-waisted straight-leg medium-blue denim jeans. The model identity, hairstyle, body type and clothing must be exactly the same in every generated image, only the pose, framing and environment change.';
}

export function buildPosePrompt(
  poseId: string,
  shoeType: string = '',
  customPrompt?: string
): string {
  const pose = POSE_CATALOG[poseId];
  if (!pose) return buildPrompt(poseId, shoeType, '', customPrompt);

  const anchor = buildCharacterAnchor();
  const typeDescriptor = shoeType && shoeType !== 'Genel Ayakkabı' ? `(${shoeType})` : `footwear`;

  return `${SYSTEM_PREAMBLE} Professional fashion editorial photograph featuring ${anchor} The model is wearing the EXACT provided ${typeDescriptor} from the reference image. Scene: ${pose.prompt}. ${customPrompt ? `Additional user note: ${customPrompt}.` : ''} Hyper-realistic, 8k, sharp focus, cinematic color grading.`;
}

export function buildPrompt(
  vibe: string,
  shoeType: string = '',
  material: string = '',
  customPrompt?: string
): string {
  const baseVibe = VIBE_PROMPTS[vibe] || VIBE_PROMPTS["Stüdyo"];
  const randomAddition = RANDOM_ELEMENTS[Math.floor(Math.random() * RANDOM_ELEMENTS.length)];

  const typeDescriptor = shoeType && shoeType !== 'Genel Ayakkabı' ? `(${shoeType})` : `footwear item`;
  const matDescriptor = material ? `made of ${material}` : '';

  return `${SYSTEM_PREAMBLE} Professional commercial product photography of the exact provided ${typeDescriptor} ${matDescriptor}. ${baseVibe}. Atmosphere details: ${randomAddition}. ${customPrompt ? `Additional user note: ${customPrompt}.` : ''}`;
}

// Stage 1 (studio izolasyon) için odaklı prompt — persona + pair + zero-change güçlü kalır
export function buildStudioPrompt(opts: {
  isDesignMode: boolean;
  shoeType?: string;
  customPrompt?: string;
  refHints?: string;
}): string {
  const { isDesignMode, shoeType, customPrompt, refHints } = opts;
  const typeDescriptor = shoeType && shoeType !== 'Genel Ayakkabı' ? `(${shoeType})` : `footwear`;

  if (isDesignMode) {
    return `${SYSTEM_PREAMBLE} High-end shoe design concept ${typeDescriptor}: ${customPrompt || ''}. ${refHints || ''} Professional studio shot, white background, beautiful design details, hyper-realistic, 8k.`;
  }
  return `${SYSTEM_PREAMBLE} High-fidelity studio isolation of the reference ${typeDescriptor}, solid white background, exact 1:1 detail preservation, professional product photography. ${refHints || ''} Hyper-realistic, 8k, sharp focus.`;
}
