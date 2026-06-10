const Post = require('../models/Post');
const { generatePostContent } = require('../services/aiService');
const {
  resolveUser,
  resolvePlatform,
  mapStatutFromFrontend,
  mapMediasFromFrontend,
  mapPostToFrontend,
} = require('../utils/resolveRefs');

async function buildPostData(body, user, platform) {
  const {
    contenu,
    caption,
    description,
    hashtags,
    statut,
    status,
    source,
    useAI,
    date_planification,
    scheduledDate,
    scheduleAt,
    type,
    medias,
    media,
    meta,
  } = body;

  const theme = description?.trim() || body.aiPrompt?.trim() || '';
  let finalContenu = contenu || caption || '';
  let finalHashtags = hashtags || '';
  let finalSource = source || 'manuel';

  if (useAI && theme) {
    finalContenu = await generatePostContent({
      description: theme,
      platform: platform.nom,
      postType: type || 'image',
      field: 'contenu',
    });
    if (!finalHashtags) {
      finalHashtags = await generatePostContent({
        description: theme,
        platform: platform.nom,
        postType: type || 'image',
        field: 'hashtags',
      });
    }
    finalSource = 'ai';
  }

  const planDate = date_planification || scheduledDate || scheduleAt;

  return {
    id_utilisateur: user._id,
    id_plateforme: platform._id,
    contenu: finalContenu,
    description: theme,
    hashtags: finalHashtags,
    statut: mapStatutFromFrontend(statut || status || 'brouillon'),
    source: finalSource,
    date_planification: planDate ? new Date(planDate) : undefined,
    type: type || 'image',
    medias: mapMediasFromFrontend(medias || media),
    meta: meta || {},
  };
}

exports.getPosts = async (req, res) => {
  try {
    const { platform, statut, status, id_utilisateur } = req.query;
    const filter = {};

    if (id_utilisateur) filter.id_utilisateur = id_utilisateur;

    if (platform) {
      const plat = await resolvePlatform(platform);
      filter.id_plateforme = plat._id;
    }

    const statusFilter = statut || status;
    if (statusFilter) {
      filter.statut = mapStatutFromFrontend(statusFilter);
    }

    const posts = await Post.find(filter)
      .populate('id_plateforme', 'nom')
      .populate('id_utilisateur', 'nom')
      .sort({ createdAt: -1 });

    res.json(posts.map(mapPostToFrontend));
  } catch (error) {
    console.error('Erreur GET posts:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('id_plateforme', 'nom')
      .populate('id_utilisateur', 'nom');

    if (!post) return res.status(404).json({ error: 'Post introuvable' });
    res.json(mapPostToFrontend(post));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const user = await resolveUser(req.body.id_utilisateur);
    const platform = await resolvePlatform(req.body.id_plateforme || req.body.platform);
    const postData = await buildPostData(req.body, user, platform);
    const post = await Post.create(postData);

    const populated = await Post.findById(post._id)
      .populate('id_plateforme', 'nom')
      .populate('id_utilisateur', 'nom');

    res.status(201).json(mapPostToFrontend(populated));
  } catch (error) {
    console.error('Erreur création post:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post introuvable' });

    const updates = { ...req.body };

    if (updates.caption !== undefined) updates.contenu = updates.caption;
    if (updates.status !== undefined) updates.statut = mapStatutFromFrontend(updates.status);
    if (updates.statut !== undefined) updates.statut = mapStatutFromFrontend(updates.statut);
    if (updates.scheduledDate || updates.scheduleAt) {
      updates.date_planification = new Date(updates.scheduledDate || updates.scheduleAt);
    }
    if (updates.media || updates.medias) {
      updates.medias = mapMediasFromFrontend(updates.media || updates.medias);
    }

    delete updates.caption;
    delete updates.status;
    delete updates.scheduledDate;
    delete updates.scheduleAt;
    delete updates.media;

    const updated = await Post.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('id_plateforme', 'nom')
      .populate('id_utilisateur', 'nom');

    res.json(mapPostToFrontend(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.regenerateContent = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('id_plateforme', 'nom');
    if (!post) return res.status(404).json({ error: 'Post introuvable' });

    const theme = req.body.description?.trim() || post.description?.trim();
    if (!theme) {
      return res.status(400).json({ error: 'Aucune description/thématique disponible pour régénérer le contenu' });
    }

    const newContenu = await generatePostContent({
      description: theme,
      platform: post.id_plateforme?.nom || 'facebook',
      postType: post.type || 'image',
      field: 'contenu',
    });

    post.contenu = newContenu;
    post.description = theme;
    post.source = 'ai';
    await post.save();

    const populated = await Post.findById(post._id)
      .populate('id_plateforme', 'nom')
      .populate('id_utilisateur', 'nom');

    res.json(mapPostToFrontend(populated));
  } catch (error) {
    console.error('Erreur régénération:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post introuvable' });
    res.json({ message: 'Post supprimé', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
