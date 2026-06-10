const { generatePostContent, generatePostMedia } = require('../services/aiService');

exports.generateContent = async (req, res) => {
  try {
    const { description, platform, postType, field, regenerate, seed, previousContent } = req.body;

    if (!description?.trim()) {
      return res.status(400).json({ error: 'Le champ description (thématique) est requis' });
    }

    const contenu = await generatePostContent({
      description: description.trim(),
      platform: platform || 'facebook',
      postType: postType || 'image',
      field: field || 'contenu',
      regenerate: Boolean(regenerate),
      seed: seed || Date.now(),
      previousContent,
    });

    res.json({ contenu, description: description.trim() });
  } catch (error) {
    console.error('Erreur génération IA:', error.message);
    const isAuthError = error.status === 401 || /api key|api_key|invalid/i.test(error.message);
    const isQuotaError = error.status === 429 || /quota|rate limit|resource exhausted/i.test(error.message);
    let message = error.message || 'Erreur lors de la génération IA';
    if (isAuthError) {
      message = 'Clé Gemini invalide. Ajoutez GEMINI_API_KEY dans server/.env (clé gratuite sur https://aistudio.google.com/app/apikey) puis redémarrez le serveur.';
    } else if (isQuotaError) {
      message = 'Quota Gemini dépassé. Réessayez plus tard ou vérifiez vos limites sur https://aistudio.google.com';
    }
    const status = isAuthError ? 401 : isQuotaError ? 429 : 500;
    res.status(status).json({ error: message });
  }
};

exports.generateMedia = async (req, res) => {
  try {
    const { description, platform, postType, count, regenerate, seed } = req.body;

    if (!description?.trim()) {
      return res.status(400).json({ error: 'Le champ description (thématique) est requis' });
    }

    const media = await generatePostMedia({
      description: description.trim(),
      platform: platform || 'facebook',
      postType: postType || 'image',
      count: count || 1,
      regenerate: Boolean(regenerate),
      seed: seed || Date.now(),
    });

    res.json({ media, description: description.trim() });
  } catch (error) {
    console.error('Erreur génération média:', error.message);
    const isAuthError = error.status === 401 || /api key|api_key|invalid/i.test(error.message);
    const isQuotaError = error.status === 429 || /quota|rate limit|resource exhausted/i.test(error.message);
    let message = error.message || 'Erreur lors de la génération des médias';
    if (isAuthError) {
      message = 'Clé Gemini invalide. Vérifiez GEMINI_API_KEY dans server/.env';
    } else if (isQuotaError) {
      message = 'Quota Gemini dépassé pour les médias. Réessayez plus tard.';
    }
    const status = isAuthError ? 401 : isQuotaError ? 429 : 500;
    res.status(status).json({ error: message });
  }
};

exports.generateHashtags = async (req, res) => {
  try {
    const { description, platform, postType, regenerate, seed, previousContent } = req.body;

    if (!description?.trim()) {
      return res.status(400).json({ error: 'Le champ description est requis' });
    }

    const hashtags = await generatePostContent({
      description: description.trim(),
      platform: platform || 'facebook',
      postType: postType || 'image',
      field: 'hashtags',
      regenerate: Boolean(regenerate),
      seed: seed || Date.now(),
      previousContent,
    });

    res.json({ hashtags, description: description.trim() });
  } catch (error) {
    console.error('Erreur génération hashtags:', error.message);
    const isAuthError = error.status === 401 || /api key|api_key|invalid/i.test(error.message);
    const isQuotaError = error.status === 429 || /quota|rate limit|resource exhausted/i.test(error.message);
    let message = error.message || 'Erreur lors de la génération des hashtags';
    if (isAuthError) {
      message = 'Clé Gemini invalide. Ajoutez GEMINI_API_KEY dans server/.env (clé gratuite sur https://aistudio.google.com/app/apikey) puis redémarrez le serveur.';
    } else if (isQuotaError) {
      message = 'Quota Gemini dépassé. Réessayez plus tard ou vérifiez vos limites sur https://aistudio.google.com';
    }
    const status = isAuthError ? 401 : isQuotaError ? 429 : 500;
    res.status(status).json({ error: message });
  }
};
