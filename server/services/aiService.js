const OpenAI = require('openai');

let geminiClient = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      'Clé Gemini manquante. Ajoutez GEMINI_API_KEY dans server/.env puis redémarrez le serveur. Obtenez une clé gratuite sur https://aistudio.google.com/app/apikey'
    );
  }

  if (
    apiKey.includes('votre-cle') ||
    apiKey.includes('your-api-key') ||
    apiKey.includes('your-gemini') ||
    apiKey.endsWith('-ici')
  ) {
    throw new Error(
      'Clé Gemini invalide (valeur d\'exemple détectée). Remplacez GEMINI_API_KEY dans server/.env par votre vraie clé depuis https://aistudio.google.com/app/apikey'
    );
  }

  if (!geminiClient) {
    geminiClient = new OpenAI({
      apiKey,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
  }
  return geminiClient;
}

const PLATFORM_TONES = {
  facebook: 'ton convivial et engageant pour Facebook',
  instagram: 'ton visuel, moderne et authentique pour Instagram',
  linkedin: 'ton professionnel et inspirant pour LinkedIn',
  x: 'ton percutant et concis pour X (Twitter)',
  tiktok: 'ton dynamique et tendance pour TikTok',
  threads: 'ton conversationnel pour Threads',
  pinterest: 'ton inspirant et descriptif pour Pinterest',
  youtube: 'ton informatif pour YouTube',
};

const HASHTAG_EXTRAS = ['trending', 'inspiration', 'daily', 'lifestyle', 'viral', 'community', 'creative', 'moment'];
const CAPTION_INTROS = [
  (topic) => `Découvrez ${topic} !`,
  (topic) => `Plongez dans l'univers de ${topic}.`,
  (topic) => `${topic} : un contenu qui mérite votre attention.`,
  (topic) => `Envie de ${topic} ? Vous êtes au bon endroit.`,
];
const CAPTION_CTAS = [
  'Dites-nous ce que vous en pensez en commentaire !',
  'Partagez avec votre communauté !',
  'Likez si ce contenu vous inspire !',
  'Enregistrez ce post pour plus tard !',
];

function getTextModels() {
  const primary = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const models = [primary, 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
  return [...new Set(models)];
}

function buildFallbackCaption(description, platform, postType, regenerate = false, seed = Date.now()) {
  const intro = CAPTION_INTROS[seed % CAPTION_INTROS.length](description);
  const cta = CAPTION_CTAS[(seed + 2) % CAPTION_CTAS.length];
  const angles = [
    'Une approche fraîche et authentique.',
    'Un angle créatif pour marquer les esprits.',
    'Une version qui parle directement à votre audience.',
    "Un message pensé pour susciter l'interaction.",
  ];
  const angle = angles[(seed + 3) % angles.length];
  return `${intro}\n\n${angle} Un ${postType || 'post'} ${platform} qui fait la différence. ${cta}`;
}

async function callGeminiText({ systemPrompt, userPrompt, maxTokens = 400, temperature = 0.8 }) {
  const client = getClient();
  let lastError = null;

  for (const model of getTextModels()) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const result = response.choices[0]?.message?.content?.trim();
      if (result && result.length > 15 && !/^voici quelques options/i.test(result)) {
        return result;
      }
    } catch (error) {
      lastError = error;
      if (error.status !== 429) break;
    }
  }

  throw lastError || new Error('Impossible de générer le texte');
}

function buildFallbackHashtags(description, platform, regenerate = false, seed = Date.now()) {
  const words = description
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);

  const wordTags = words.map((w) => `#${w}`);
  const baseTags = [`#${platform}`, '#socialmedia', '#contenu', '#community'];
  const extras = HASHTAG_EXTRAS.map((tag) => `#${tag}`);
  const pool = [...wordTags, ...baseTags, ...extras];
  const offset = regenerate ? seed % Math.max(pool.length - 4, 1) : 0;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];

  return [...new Set(rotated)]
    .filter((tag) => tag.length > 1)
    .slice(0, 8)
    .join(' ');
}

function buildAvoidRepeatClause(previousContent) {
  if (!previousContent?.trim()) return '';
  const excerpt = previousContent.trim().slice(0, 300);
  return ` Ne répète PAS ce texte existant : """${excerpt}""". Propose une version clairement différente.`;
}

async function generatePostContent({
  description,
  platform = 'facebook',
  postType = 'image',
  field = 'contenu',
  regenerate = false,
  seed = Date.now(),
  previousContent = '',
}) {
  const tone = PLATFORM_TONES[platform.toLowerCase()] || 'ton adapté aux réseaux sociaux';
  const typeLabel = postType || 'post';

  if (field === 'hashtags') {
    try {
      const userPrompt = regenerate
        ? `Génère une NOUVELLE liste de 5 à 8 hashtags différents (séparés par des espaces, commençant par #) ` +
          `pour un ${typeLabel} sur ${platform} avec cette thématique : "${description}". Variante #${seed}.` +
          buildAvoidRepeatClause(previousContent)
        : `Génère une liste de 5 à 8 hashtags pertinents (séparés par des espaces, commençant par #) ` +
          `pour un ${typeLabel} sur ${platform} avec cette thématique : "${description}".`;

      return await callGeminiText({
        systemPrompt:
          'Tu es un community manager expert. Réponds uniquement avec les hashtags demandés, séparés par des espaces.',
        userPrompt,
        maxTokens: 120,
        temperature: regenerate ? 0.95 : 0.7,
      });
    } catch {
      return buildFallbackHashtags(description, platform, regenerate, seed);
    }
  }

  try {
    const userPrompt = regenerate
      ? `Rédige une NOUVELLE légende différente pour un ${typeLabel} sur ${platform} avec un ${tone}. ` +
        `Thématique : "${description}". 2 à 4 phrases, engageante, avec appel à l'action. Variante #${seed}. ` +
        `Réponds uniquement avec la légende finale, sans introduction ni liste d'options. N'inclus pas de hashtags.` +
        buildAvoidRepeatClause(previousContent)
      : `Rédige la légende (caption) d'un ${typeLabel} pour ${platform} avec un ${tone}. ` +
        `Thématique / mot-clé : "${description}". ` +
        `La légende doit être engageante, naturelle, 2 à 4 phrases, avec un appel à l'action. ` +
        `Réponds uniquement avec la légende finale, sans introduction. N'inclus pas de hashtags.`;

    return await callGeminiText({
      systemPrompt:
        'Tu es un community manager expert. Tu rédiges des contenus en français pour les réseaux sociaux. ' +
        'Réponds uniquement avec la légende demandée, sans guillemets, sans explication, sans proposer plusieurs options.',
      userPrompt,
      maxTokens: 400,
      temperature: regenerate ? 0.95 : 0.8,
    });
  } catch {
    return buildFallbackCaption(description, platform, postType, regenerate, seed);
  }
}

const STOCK_VIDEOS = [
  { tags: ['fleur', 'flower', 'nature', 'plante', 'green'], url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
  { tags: ['eau', 'river', 'nature', 'paysage'], url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/river.mp4' },
  { tags: ['ville', 'city', 'urbain', 'street'], url: 'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4' },
  { tags: ['food', 'cuisine', 'restaurant', 'plat'], url: 'https://videos.pexels.com/video-files/4252725/4252725-uhd_2560_1440_25fps.mp4' },
  { tags: ['sport', 'fitness', 'workout'], url: 'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4' },
  { tags: ['fleur', 'flower', 'nature'], url: 'https://videos.pexels.com/video-files/856973/856973-hd_1280_720_30fps.mp4' },
  { tags: ['tech', 'digital', 'business'], url: 'https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_30fps.mp4' },
  { tags: ['nature', 'paysage'], url: 'https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4' },
];

const SEARCH_VARIANTS = ['nature', 'aesthetic', 'close-up', 'vibrant', 'minimal', 'lifestyle', 'creative', 'modern'];
const MAX_VIDEO_DURATION_SEC = 600;
const LONG_VIDEO_TITLE_HINTS = [
  'podcast', 'interview', 'episode', 'documentary', 'lecture', 'webinar',
  'conference', 'soundtrack', 'trailer', 'full film', 'full movie', 'tv special',
];

const FRENCH_STOP_WORDS = new Set([
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se',
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'votre', 'leur',
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux', 'en', 'dans', 'sur',
  'sous', 'pour', 'par', 'avec', 'sans', 'chez', 'entre', 'vers', 'depuis', 'avant',
  'apres', 'tres', 'plus', 'moins', 'aussi', 'encore', 'deja', 'tout', 'tous', 'toute',
  'toutes', 'cette', 'ce', 'ces', 'cet', 'qui', 'que', 'quoi', 'dont', 'ou', 'et', 'ou',
  'mais', 'donc', 'car', 'ni', 'si', 'comme', 'afin', 'afin', 'etre', 'avoir', 'faire',
  'peut', 'bien', 'tres', 'souhaite', 'promouvoir', 'promotion', 'nouveau', 'nouvelle',
  'nouveaux', 'nouvelles', 'monde', 'post', 'contenu', 'publier', 'partager', 'decouvrez',
  'decouvrir', 'suivez', 'likez', 'abonnez', 'instagram', 'facebook', 'linkedin',
]);

function buildFallbackSearchQuery(description, regenerate, seed) {
  const base = description.trim();
  if (!regenerate) return base;
  const variant = SEARCH_VARIANTS[seed % SEARCH_VARIANTS.length];
  return `${base} ${variant}`;
}

function cleanSearchQuery(query) {
  return String(query || '')
    .replace(/^[\s\-*\d.]+/, '')
    .replace(/['".]/g, '')
    .replace(/[^\x00-\x7F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractVisualWords(description) {
  return translateThemeHints(description)
    .split(/\s+/)
    .filter((word) => isVisualToken(word));
}

function buildMediaSearchFallbacks(description, regenerate = false, seed = Date.now()) {
  const words = extractVisualWords(description);
  const translated = words.join(' ');
  const variant = regenerate ? SEARCH_VARIANTS[seed % SEARCH_VARIANTS.length] : '';
  const queries = [
    words.slice(0, 6).join(' '),
    words.slice(0, 4).join(' '),
    words.slice(0, 3).join(' '),
    words.slice(0, 2).join(' '),
    words[0],
    translated,
    cleanSearchQuery(buildFallbackSearchQuery(description, regenerate, seed)),
  ]
    .map((q) => cleanSearchQuery(q))
    .filter(Boolean);

  if (variant && words.length) {
    queries.unshift(cleanSearchQuery(`${words.slice(0, 4).join(' ')} ${variant}`));
  }

  return [...new Set(queries)];
}

function isVisualToken(word) {
  const token = String(word || '').toLowerCase();
  return token.length > 2 && !FRENCH_STOP_WORDS.has(token);
}

function parseThemeBrief(text) {
  const queries = [];
  const keywords = [];
  let scene = '';
  const plainLines = [];

  String(text || '').split('\n').forEach((rawLine) => {
    const line = rawLine.trim().replace(/^[-*•]\s*/, '');
    if (!line) return;

    if (/^QUERY\s*1\s*:/i.test(line)) {
      queries.push(cleanSearchQuery(line.replace(/^QUERY\s*1\s*:/i, '')));
      return;
    }
    if (/^QUERY\s*2\s*:/i.test(line)) {
      queries.push(cleanSearchQuery(line.replace(/^QUERY\s*2\s*:/i, '')));
      return;
    }
    if (/^QUERY\s*3\s*:/i.test(line)) {
      queries.push(cleanSearchQuery(line.replace(/^QUERY\s*3\s*:/i, '')));
      return;
    }
    if (/^KEYWORDS\s*:/i.test(line)) {
      line.replace(/^KEYWORDS\s*:/i, '')
        .split(',')
        .map((word) => cleanSearchQuery(word))
        .filter((word) => isVisualToken(word))
        .forEach((word) => keywords.push(word));
      return;
    }
    if (/^SCENE\s*:/i.test(line)) {
      scene = line.replace(/^SCENE\s*:/i, '').trim();
      return;
    }

    const cleaned = cleanSearchQuery(line);
    if (cleaned && cleaned.length <= 60 && !/^(query|keywords|scene)\b/i.test(cleaned)) {
      plainLines.push(cleaned);
    }
  });

  if (!queries.length) {
    plainLines.slice(0, 3).forEach((line) => queries.push(line));
  }

  return {
    queries: [...new Set(queries.filter(Boolean))],
    keywords: [...new Set(keywords.filter(isVisualToken))],
    scene: scene.trim(),
  };
}

async function extractMediaThemeBrief({
  description,
  platform,
  postType,
  mediaType = 'image',
}) {
  try {
    const result = await callGeminiText({
      systemPrompt:
        'You analyze French social media post themes. They can be one word or a long paragraph. ' +
        `Your job: understand the EXACT visual subject requested and produce English stock ${mediaType} search data. ` +
        'Ignore hashtags, calls-to-action, and marketing fluff — focus on what must be SEEN in the photo/video. ' +
        'Reply in this exact format (5 lines only):\n' +
        'QUERY1: <3-6 English words, most precise visual search>\n' +
        'QUERY2: <3-6 English words, alternative visual angle>\n' +
        'QUERY3: <3-6 English words, another visual angle>\n' +
        'KEYWORDS: <6-10 comma-separated English visual keywords from the theme>\n' +
        'SCENE: <one English sentence describing the exact scene to show>',
      userPrompt:
        `Platform: ${platform}. Post type: ${postType}. Media: ${mediaType}. ` +
        `French theme (may be long): """${description.trim()}"""`,
      maxTokens: 220,
      temperature: 0.25,
    });

    const parsed = parseThemeBrief(result);
    if (parsed.queries.length) return parsed;
  } catch {
    /* fallback below */
  }

  return null;
}

async function buildMediaSearchContext({
  description,
  platform,
  postType,
  mediaType = 'image',
  regenerate = false,
  seed = Date.now(),
}) {
  const fallbackQueries = buildMediaSearchFallbacks(description, regenerate, seed);
  const brief = await extractMediaThemeBrief({ description, platform, postType, mediaType });

  let queries = fallbackQueries;
  let mustKeywords = [];
  const visualWords = extractVisualWords(description);
  let visualScene = visualWords.join(' ') || description.trim();

  if (brief) {
    queries = [...new Set([...brief.queries, ...fallbackQueries])];
    mustKeywords = brief.keywords;
    if (brief.scene) visualScene = brief.scene;
    else if (brief.queries[0]) visualScene = brief.queries[0];
  } else {
    try {
      const result = await callGeminiText({
        systemPrompt:
          `Convert a French social media theme into precise ENGLISH stock ${mediaType} search queries. ` +
          'The theme may be a long sentence. Extract the core visual subject. ' +
          'Return exactly 3 lines. Each line = one query of 3 to 6 visual English words. ' +
          'No French. No numbering. No explanation.',
        userPrompt:
          `Platform: ${platform}. Post type: ${postType}. Theme: """${description.trim()}"""` +
          (regenerate ? ` Alternative set #${seed}.` : ''),
        maxTokens: 100,
        temperature: regenerate ? 0.75 : 0.35,
      });

      const geminiQueries = result
        .split('\n')
        .map((line) => cleanSearchQuery(line))
        .filter(Boolean);

      if (geminiQueries.length) {
        queries = [...new Set([...geminiQueries, ...fallbackQueries])];
      }
    } catch {
      /* keep fallback queries */
    }
  }

  const keywords = [...new Set([
    ...getThemeKeywords(description, queries),
    ...mustKeywords,
  ])];

  return {
    queries: queries.filter(Boolean),
    keywords,
    mustKeywords,
    visualScene,
    primaryQuery: queries[0],
  };
}

function getThemeKeywords(description, queries = []) {
  const words = new Set();
  const addWords = (text) => {
    String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((word) => isVisualToken(word))
      .forEach((word) => {
        const mapped = THEME_WORD_MAP[word] || word;
        mapped.split(/\s+/).filter((part) => isVisualToken(part)).forEach((part) => words.add(part));
      });
  };

  addWords(translateThemeHints(description));
  addWords(description);
  queries.forEach((query) => addWords(query));
  return [...words];
}

function scoreTextAgainstKeywords(text, keywords, mustKeywords = []) {
  const hay = String(text || '').toLowerCase();
  let score = keywords.reduce((acc, keyword) => {
    if (!keyword || !hay.includes(keyword)) return acc;
    return acc + (keyword.length > 4 ? 3 : 2);
  }, 0);

  if (mustKeywords.length) {
    const mustHits = mustKeywords.filter((keyword) => keyword && hay.includes(keyword.toLowerCase()));
    score += mustHits.length * 5;
    if (mustHits.length === 0) score -= 12;
    else if (mustHits.length >= Math.min(2, mustKeywords.length)) score += 6;
  }

  return score;
}

function scoreOpenverseItem(item, keywords, mustKeywords = []) {
  const tags = (item.tags || []).map((tag) => tag.name).join(' ');
  return scoreTextAgainstKeywords(`${item.title || ''} ${tags}`, keywords, mustKeywords);
}

function scoreVideoTitle(title, keywords, mustKeywords = []) {
  const normalized = String(title || '')
    .replace(/^File:/i, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ');
  let score = scoreTextAgainstKeywords(normalized, keywords, mustKeywords);
  const lower = normalized.toLowerCase();
  LONG_VIDEO_TITLE_HINTS.forEach((hint) => {
    if (lower.includes(hint)) score -= 6;
  });
  return score;
}

function getWikimediaDuration(metadata) {
  const entry = (metadata || []).find((item) => item.name === 'playtime_seconds');
  if (entry?.value == null) return null;
  const duration = Number(entry.value);
  return Number.isFinite(duration) ? duration : null;
}

function isVideoDurationAllowed(duration) {
  if (duration == null) return true;
  return duration > 0 && duration <= MAX_VIDEO_DURATION_SEC;
}

async function generateThemeSearchQueries(params) {
  const context = await buildMediaSearchContext(params);
  return context.queries;
}

async function generateImageSearchQuery(params) {
  const context = await buildMediaSearchContext({ ...params, mediaType: 'image' });
  return context.primaryQuery;
}

async function tryGeminiImage(themeDescription, searchQuery) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const imageModel = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const prompt =
    `Create a high-quality social media photo that clearly illustrates this theme: "${themeDescription}". ` +
    `The image must visually represent: ${searchQuery}. Photorealistic, on-topic, no text overlay.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) return null;

  const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!imagePart) return null;

  const mime = imagePart.inlineData.mimeType || 'image/png';
  return `data:${mime};base64,${imagePart.inlineData.data}`;
}

async function fetchOpenversePage(query, page, pageSize) {
  const response = await fetch(
    `https://api.openverse.engineering/v1/images/?q=${encodeURIComponent(query)}` +
    `&page=${page}&page_size=${pageSize}&license_type=commercial,modification`
  );
  if (!response.ok) return [];
  const data = await response.json();
  return (data.results || []).filter((img) => {
    const url = String(img.url || '').toLowerCase();
    return url && !url.endsWith('.svg') && !url.endsWith('.gif');
  });
}

async function searchOpenverseImagesThemed(
  description,
  queries,
  count = 1,
  { page = 1, seed = Date.now(), keywords = [], mustKeywords = [] } = {}
) {
  const themeKeywords = keywords.length ? keywords : getThemeKeywords(description, queries);
  const pageSize = 20;
  let pool = [];

  for (const query of queries) {
    for (let p = page; pool.length < count * 8 && p <= page + 4; p += 1) {
      const batch = await fetchOpenversePage(query, p, pageSize);
      batch.forEach((img) => {
        pool.push({
          ...img,
          relevance: scoreOpenverseItem(img, themeKeywords, mustKeywords),
          searchQuery: query,
        });
      });
    }
  }

  const seen = new Set();
  pool = pool.filter((img) => {
    if (seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  });

  if (!pool.length) {
    if (page > 1) {
      return searchOpenverseImagesThemed(description, queries, count, {
        page: 1,
        seed,
        keywords: themeKeywords,
        mustKeywords,
      });
    }
    throw new Error(`Aucune image trouvée pour la thématique "${description}"`);
  }

  pool.sort((a, b) => b.relevance - a.relevance);
  const relevant = pool.filter((img) => img.relevance > 0);
  const ranked = relevant.length ? relevant : pool;

  if (mustKeywords.length && !relevant.length) {
    throw new Error(
      `Aucune image suffisamment liée au sujet "${description.slice(0, 80)}..." — reformulez ou simplifiez la thématique.`
    );
  }

  const offset = regenerateOffset(seed, ranked.length, count);
  return ranked.slice(offset, offset + count).map((img, index) => ({
    url: img.url,
    type: 'image',
    ordre: index,
    searchQuery: img.searchQuery,
    relevance: img.relevance,
  }));
}

function regenerateOffset(seed, poolLength, count) {
  if (poolLength <= count) return 0;
  return seed % Math.max(poolLength - count + 1, 1);
}

async function searchOpenverseImages(query, count = 1, options = {}) {
  const description = options.description || query;
  const queries = options.queries || [query];
  return searchOpenverseImagesThemed(description, queries, count, options);
}

function pickStockVideo(query, seed = Date.now()) {
  const q = query.toLowerCase();
  const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  const scored = STOCK_VIDEOS.map((item) => ({
    item,
    score: item.tags.reduce((acc, tag) => {
      if (q.includes(tag)) return acc + 3;
      if (tokens.some((t) => t.includes(tag) || tag.includes(t))) return acc + 2;
      return acc;
    }, 0),
  }));
  scored.sort((a, b) => b.score - a.score);
  const pool = scored.filter((entry) => entry.score > 0).map((entry) => entry.item);
  const candidates = pool.length ? pool : STOCK_VIDEOS;
  return candidates[seed % candidates.length];
}

const THEME_WORD_MAP = {
  cafe: 'coffee',
  café: 'coffee',
  plage: 'beach',
  mer: 'ocean',
  voyage: 'travel',
  montagne: 'mountain',
  cuisine: 'cooking',
  restaurant: 'restaurant',
  pizza: 'pizza',
  sport: 'sport',
  fitness: 'fitness',
  yoga: 'yoga',
  mode: 'fashion',
  beauté: 'beauty',
  beaute: 'beauty',
  nature: 'nature',
  ville: 'city',
  paris: 'paris',
  animaux: 'animals',
  chien: 'dog',
  chat: 'cat',
  fleurs: 'flowers',
  jardin: 'garden',
  technologie: 'technology',
  tech: 'technology',
  business: 'business',
  musique: 'music',
  danse: 'dance',
  mariage: 'wedding',
  enfants: 'children',
  voiture: 'car',
  luxe: 'luxury',
  soleil: 'sun',
  coucher: 'sunset',
  lever: 'sunrise',
  neige: 'snow',
  pluie: 'rain',
  foret: 'forest',
  ocean: 'ocean',
  lac: 'lake',
  piscine: 'pool',
  hotel: 'hotel',
  voyageur: 'traveler',
  avion: 'airplane',
  train: 'train',
  velo: 'bicycle',
  running: 'running',
  football: 'football',
  basketball: 'basketball',
  maquillage: 'makeup',
  coiffure: 'hairstyle',
  bijoux: 'jewelry',
  architecture: 'architecture',
  art: 'art',
  livre: 'book',
  ecole: 'school',
  bureau: 'office',
  startup: 'startup',
  marketing: 'marketing',
  ecommerce: 'ecommerce',
  produit: 'product',
  artisanal: 'artisanal',
  artisanale: 'artisanal',
  torrefie: 'roasted',
  torrefies: 'roasted',
  grains: 'coffee beans',
  chaleureuse: 'cozy',
  chaleureux: 'cozy',
  coloree: 'colorful',
  colore: 'colorful',
  ambiance: 'atmosphere',
  latte: 'latte',
  barista: 'barista',
  boulangerie: 'bakery',
  patisserie: 'pastry',
  gateau: 'cake',
  chocolat: 'chocolate',
  vin: 'wine',
  biere: 'beer',
  cocktail: 'cocktail',
  piscine: 'swimming pool',
  spa: 'spa',
  massage: 'massage',
  medecine: 'medicine',
  sante: 'health',
  ecologie: 'ecology',
  durable: 'sustainable',
  renouvelable: 'renewable',
};

function translateThemeHints(description) {
  return description
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2)
    .map((word) => THEME_WORD_MAP[word] || word)
    .join(' ')
    .trim();
}

async function generateVideoSearchQuery(params) {
  const context = await buildMediaSearchContext({ ...params, mediaType: 'video' });
  return context.primaryQuery;
}

function videoFormatScore(title) {
  if (/\.webm$/i.test(title)) return 4;
  if (/\.mp4$/i.test(title)) return 3;
  if (/\.mov$/i.test(title)) return 2;
  if (/\.ogv$/i.test(title)) return 1;
  return 0;
}

function getPexelsApiKey() {
  return process.env.PEXELS_API_KEY?.trim() || '';
}

async function searchPexelsPhotos(query, { keywords = [], mustKeywords = [], page = 1, perPage = 20 } = {}) {
  const apiKey = getPexelsApiKey();
  if (!apiKey) return [];

  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    page: String(page),
  });

  const response = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: apiKey },
  });
  if (!response.ok) return [];

  const data = await response.json();
  return (data.photos || [])
    .map((photo) => {
      const url = photo.src?.large2x || photo.src?.large || photo.src?.original;
      if (!url) return null;

      const relevance = scoreTextAgainstKeywords(
        `${photo.alt || ''} ${query}`,
        keywords,
        mustKeywords
      ) + 10;

      return {
        url,
        type: 'image',
        relevance,
        searchQuery: query,
        source: 'pexels',
        photographer: photo.photographer || null,
        attribution: photo.photographer ? `Photo by ${photo.photographer} on Pexels` : 'Photo on Pexels',
      };
    })
    .filter(Boolean);
}

async function searchThemedImages(
  description,
  searchContext,
  count = 1,
  { page = 1, seed = Date.now() } = {}
) {
  const queries = [...new Set((searchContext?.queries || []).filter(Boolean))];
  const keywords = searchContext?.keywords?.length
    ? searchContext.keywords
    : getThemeKeywords(description, queries);
  const mustKeywords = searchContext?.mustKeywords || [];
  let pool = [];

  if (getPexelsApiKey()) {
    for (const query of queries) {
      const batch = await searchPexelsPhotos(query, { keywords, mustKeywords, page });
      pool.push(...batch);
    }
  }

  const openverseResults = await searchOpenverseImagesThemed(
    description,
    queries,
    Math.max(count * 3, 6),
    { page, seed, keywords, mustKeywords }
  );
  pool.push(...openverseResults.map((img) => ({
    ...img,
    source: img.source || 'openverse',
  })));

  const seen = new Set();
  pool = pool.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  if (!pool.length) {
    throw new Error(`Aucune image trouvée pour la thématique "${description}"`);
  }

  pool.sort((a, b) => b.relevance - a.relevance);
  const relevant = pool.filter((item) => item.relevance > 0);
  const ranked = relevant.length >= count ? relevant : pool;
  const offset = regenerateOffset(seed, ranked.length, count);

  return ranked.slice(offset, offset + count).map((img, index) => ({
    url: img.url,
    type: 'image',
    ordre: index,
    searchQuery: img.searchQuery,
    relevance: img.relevance,
    source: img.source,
    ...(img.photographer ? { photographer: img.photographer, attribution: img.attribution } : {}),
  }));
}

async function searchPexelsVideos(query, { keywords = [], mustKeywords = [], page = 1, orientation } = {}) {
  const apiKey = getPexelsApiKey();
  if (!apiKey) return null;

  const params = new URLSearchParams({
    query,
    per_page: '20',
    page: String(page),
  });
  if (orientation) params.set('orientation', orientation);

  const response = await fetch(`https://api.pexels.com/v1/videos/search?${params}`, {
    headers: { Authorization: apiKey },
  });
  if (!response.ok) return null;

  const data = await response.json();
  const ranked = (data.videos || [])
    .filter((video) => isVideoDurationAllowed(video.duration))
    .map((video) => {
      const file =
        video.video_files?.find((f) => f.quality === 'hd' && f.width >= 1280) ||
        video.video_files?.find((f) => f.quality === 'hd') ||
        video.video_files?.[0];
      if (!file?.link) return null;

      const relevance = Math.max(
        scoreTextAgainstKeywords(
          `${video.url || ''} ${video.user?.name || ''} ${query}`,
          keywords,
          mustKeywords
        ) + 12,
        8
      );

      return {
        url: file.link,
        poster: video.image || null,
        duration: video.duration,
        relevance,
        source: 'pexels',
        attribution: video.user?.name ? `Video by ${video.user.name} on Pexels` : 'Video on Pexels',
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.relevance - a.relevance);

  return ranked[0] || null;
}

async function fetchWikimediaVideosForTerm(term, { keywords = [], mustKeywords = [], seed = Date.now(), limit = 20 } = {}) {
  const searchTerm = `${term} filetype:video`;
  const searchResponse = await fetch(
    'https://commons.wikimedia.org/w/api.php?action=query&list=search' +
    `&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&srlimit=${limit}&format=json&origin=*`
  );
  if (!searchResponse.ok) return null;

  const searchData = await searchResponse.json();
  const hits = searchData.query?.search || [];
  if (!hits.length) return null;

  const offset = seed % hits.length;
  const rotated = [...hits.slice(offset), ...hits.slice(0, offset)];
  const titles = rotated
    .slice(0, 8)
    .map((hit) => hit.title)
    .join('|');

  const infoResponse = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=${titles}` +
    '&prop=imageinfo&iiprop=url|metadata&format=json&origin=*'
  );
  if (!infoResponse.ok) return null;

  const infoData = await infoResponse.json();
  const pages = Object.values(infoData.query?.pages || {});
  const ranked = pages
    .filter((page) => page.imageinfo?.[0]?.url && /\.(webm|mp4|ogv|mov)$/i.test(page.title))
    .map((page) => {
      const duration = getWikimediaDuration(page.imageinfo[0].metadata);
      const relevance = scoreVideoTitle(page.title, keywords, mustKeywords) + videoFormatScore(page.title);
      return {
        url: page.imageinfo[0].url,
        poster: null,
        duration,
        relevance,
        source: 'wikimedia',
        title: page.title,
      };
    })
    .filter((video) => {
      if (!isVideoDurationAllowed(video.duration)) return false;
      if (video.duration != null) return true;
      const lower = String(video.title || '').toLowerCase();
      return !LONG_VIDEO_TITLE_HINTS.some((hint) => lower.includes(hint));
    })
    .sort((a, b) => b.relevance - a.relevance);

  return ranked[0] || null;
}

async function findThemeVideo({ searchContext, description, postType, seed, page }) {
  const orientation = postType === 'reel' ? 'portrait' : 'landscape';
  const queries = [...new Set((searchContext?.queries || []).filter(Boolean))];
  const keywords = searchContext?.keywords?.length
    ? searchContext.keywords
    : getThemeKeywords(description, queries);
  const mustKeywords = searchContext?.mustKeywords || [];
  let bestMatch = null;

  for (const term of queries) {
    const pexelsPortrait = await searchPexelsVideos(term, { keywords, mustKeywords, page, orientation });
    if (pexelsPortrait && (!bestMatch || pexelsPortrait.relevance > bestMatch.relevance)) {
      bestMatch = pexelsPortrait;
    }

    const pexelsLandscape = await searchPexelsVideos(term, { keywords, mustKeywords, page });
    if (pexelsLandscape && (!bestMatch || pexelsLandscape.relevance > bestMatch.relevance)) {
      bestMatch = pexelsLandscape;
    }
  }

  if (bestMatch?.url && bestMatch.source === 'pexels') {
    return bestMatch;
  }

  for (const term of queries) {
    const wikiVideo = await fetchWikimediaVideosForTerm(term, { keywords, mustKeywords, seed });
    if (wikiVideo && (!bestMatch || wikiVideo.relevance > bestMatch.relevance)) {
      bestMatch = wikiVideo;
    }
  }

  if (bestMatch?.url && bestMatch.relevance > 0) {
    return bestMatch;
  }

  const stock = pickStockVideo(translateThemeHints(description || queries[0]), seed);
  if (stock?.url && stock.tags.some((tag) => keywords.includes(tag) || mustKeywords.includes(tag))) {
    return { url: stock.url, poster: null, duration: null, relevance: 1, source: 'stock' };
  }

  const excerpt = description.trim().slice(0, 100);
  throw new Error(
    `Aucune vidéo correspondant au sujet "${excerpt}${description.length > 100 ? '...' : ''}". ` +
    'Essayez une thématique plus visuelle ou ajoutez une clé PEXELS_API_KEY dans server/.env.'
  );
}

async function generatePostMedia({
  description,
  platform = 'facebook',
  postType = 'image',
  count = 1,
  regenerate = false,
  seed = Date.now(),
}) {
  const isVideo = ['video', 'reel'].includes(postType);
  const mediaCount = postType === 'carousel' ? Math.max(count, 1) : count;
  const page = regenerate ? (seed % 8) + 1 : 1;

  if (isVideo) {
    const searchContext = await buildMediaSearchContext({
      description,
      platform,
      postType,
      mediaType: 'video',
      regenerate,
      seed,
    });
    const video = await findThemeVideo({
      searchContext,
      description,
      postType,
      seed,
      page,
    });
    if (video.duration != null && video.duration > MAX_VIDEO_DURATION_SEC) {
      throw new Error(`Vidéo trop longue (${Math.round(video.duration / 60)} min). Maximum : 10 minutes.`);
    }
    let poster = video.poster;
    if (!poster) {
      try {
        const images = await searchThemedImages(description, searchContext, 1, { page, seed });
        poster = images[0]?.url;
      } catch {
        poster = undefined;
      }
    }
    return [{
      url: video.url,
      type: 'video',
      ordre: 0,
      searchQuery: searchContext.primaryQuery,
      visualScene: searchContext.visualScene,
      duration: video.duration ?? undefined,
      relevance: video.relevance ?? undefined,
      source: video.source ?? undefined,
      attribution: video.attribution,
      ...(poster ? { poster } : {}),
    }];
  }

  const searchContext = await buildMediaSearchContext({
    description,
    platform,
    postType,
    mediaType: 'image',
    regenerate,
    seed,
  });

  return searchThemedImages(description, searchContext, mediaCount, { page, seed });
}

module.exports = { generatePostContent, generatePostMedia };
