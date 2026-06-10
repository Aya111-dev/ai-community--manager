const User = require('../models/User');
const Platform = require('../models/Platform');

const DEFAULT_PLATFORMS = [
  'facebook',
  'instagram',
  'linkedin',
  'x',
  'tiktok',
  'threads',
  'pinterest',
  'youtube',
];

async function ensureSeedData() {
  let user = await User.findOne();
  if (!user) {
    user = await User.create({ nom: 'Utilisateur Demo' });
    console.log('Utilisateur par défaut créé');
  }

  for (const nom of DEFAULT_PLATFORMS) {
    await Platform.findOneAndUpdate({ nom }, { nom }, { upsert: true, new: true });
  }

  return user;
}

async function resolveUser(userId) {
  if (userId) {
    const user = await User.findById(userId);
    if (user) return user;
  }
  return ensureSeedData();
}

async function resolvePlatform(platformRef) {
  if (!platformRef) {
    throw new Error('id_plateforme ou platform est requis');
  }

  if (typeof platformRef === 'string' && platformRef.match(/^[0-9a-fA-F]{24}$/)) {
    const byId = await Platform.findById(platformRef);
    if (byId) return byId;
  }

  const nom = String(platformRef).toLowerCase().trim();
  let platform = await Platform.findOne({ nom });
  if (!platform) {
    platform = await Platform.create({ nom });
  }
  return platform;
}

function mapStatutFromFrontend(status) {
  const map = {
    draft: 'brouillon',
    brouillon: 'brouillon',
    scheduled: 'planifie',
    planifie: 'planifie',
    planifié: 'planifie',
    published: 'publie',
    publie: 'publie',
    publié: 'publie',
  };
  return map[String(status).toLowerCase()] || 'brouillon';
}

function mapStatutToFrontend(statut) {
  const map = {
    brouillon: 'draft',
    planifie: 'scheduled',
    publie: 'published',
  };
  return map[statut] || statut;
}

function mapMediasFromFrontend(media = []) {
  return media
    .filter((item) => item && (item.url || item.mediaUrl))
    .map((item, index) => ({
      url: item.url || item.mediaUrl,
      type: item.type || item.kind || 'image',
      ordre: item.ordre ?? index,
    }));
}

function mapPostToFrontend(post) {
  const obj = post.toObject ? post.toObject() : post;
  return {
    id: obj._id,
    _id: obj._id,
    id_utilisateur: obj.id_utilisateur,
    id_plateforme: obj.id_plateforme,
    caption: obj.contenu,
    contenu: obj.contenu,
    description: obj.description,
    hashtags: obj.hashtags,
    status: mapStatutToFrontend(obj.statut),
    statut: obj.statut,
    source: obj.source,
    type: obj.type,
    scheduledDate: obj.date_planification,
    scheduleAt: obj.date_planification,
    date_planification: obj.date_planification,
    media: (obj.medias || []).map((m) => ({
      url: m.url,
      type: m.type,
      kind: m.type,
      ordre: m.ordre,
    })),
    medias: obj.medias,
    stats: obj.stats,
    meta: obj.meta,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    platform: obj.id_plateforme?.nom,
  };
}

module.exports = {
  ensureSeedData,
  resolveUser,
  resolvePlatform,
  mapStatutFromFrontend,
  mapStatutToFrontend,
  mapMediasFromFrontend,
  mapPostToFrontend,
};
