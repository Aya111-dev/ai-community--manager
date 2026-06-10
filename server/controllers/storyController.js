const Story = require('../models/Story');
const { generatePostContent } = require('../services/aiService');
const {
  resolveUser,
  resolvePlatform,
  mapStatutFromFrontend,
  mapMediasFromFrontend,
} = require('../utils/resolveRefs');

function mapStoryToFrontend(story) {
  const obj = story.toObject ? story.toObject() : story;
  return {
    id: obj._id,
    _id: obj._id,
    contenu: obj.contenu,
    description: obj.description,
    statut: obj.statut,
    source: obj.source,
    date_planification: obj.date_planification,
    medias: obj.medias,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

exports.getStories = async (req, res) => {
  try {
    const { platform } = req.query;
    const filter = {};
    if (platform) {
      const plat = await resolvePlatform(platform);
      filter.id_plateforme = plat._id;
    }
    const stories = await Story.find(filter).sort({ createdAt: -1 });
    res.json(stories.map(mapStoryToFrontend));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createStory = async (req, res) => {
  try {
    const user = await resolveUser(req.body.id_utilisateur);
    const platform = await resolvePlatform(req.body.id_plateforme || req.body.platform);

    const theme = req.body.description?.trim() || '';
    let contenu = req.body.contenu || '';
    let source = req.body.source || 'manuel';

    if (req.body.useAI && theme) {
      contenu = await generatePostContent({
        description: theme,
        platform: platform.nom,
        postType: 'story',
        field: 'contenu',
      });
      source = 'ai';
    }

    const story = await Story.create({
      id_utilisateur: user._id,
      id_plateforme: platform._id,
      contenu,
      description: theme,
      statut: mapStatutFromFrontend(req.body.statut || req.body.status || 'brouillon'),
      source,
      date_planification: req.body.date_planification ? new Date(req.body.date_planification) : undefined,
      medias: mapMediasFromFrontend(req.body.medias || req.body.media),
      meta: req.body.meta || {},
    });

    res.status(201).json(mapStoryToFrontend(story));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.regenerateContent = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate('id_plateforme', 'nom');
    if (!story) return res.status(404).json({ error: 'Story introuvable' });

    const theme = req.body.description?.trim() || story.description?.trim();
    if (!theme) {
      return res.status(400).json({ error: 'Aucune description disponible' });
    }

    story.contenu = await generatePostContent({
      description: theme,
      platform: story.id_plateforme?.nom || 'instagram',
      postType: 'story',
      field: 'contenu',
    });
    story.source = 'ai';
    await story.save();

    res.json(mapStoryToFrontend(story));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
