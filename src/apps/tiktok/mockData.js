const now = new Date();
const offsetDate = (days, hours = 0) =>
  new Date(now.getTime() - ((days * 24 + hours) * 60 * 60 * 1000)).toISOString();

export const generateAiCaption = (prompt, itemType, mediaType) => {
  const base = prompt?.trim()
    ? prompt.trim()
    : itemType === 'story'
    ? 'une histoire rapide et engageante'
    : 'un post TikTok percutant';

  if (itemType === 'story') {
    return `Explosez vos vues avec ${base}. Ajoutez un CTA chaleureux et une tonalité visuelle premium.`;
  }

  return `Boostez l'engagement avec ${base}. Un message concis, formaté pour TikTok, avec un appel à l'action clair.`;
};

export const generateMediaPlaceholder = (itemType, mediaType) => {
  if (mediaType === 'photo') {
    return 'https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=900&q=80';
  }

  if (itemType === 'story') {
    return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';
  }

  return 'https://images.unsplash.com/photo-1517263904808-5dc0fe5f9a35?auto=format&fit=crop&w=900&q=80';
};

export const profileInfo = {
  name: 'Utilisateur',
  handle: '@vous',
  bio: "Je crée des contenus TikTok professionnels et des stratégies marketing performantes pour l'audience.",
  avatarColor: '#7c3aed',
  followers: 14200,
  following: 124,
  posts: 32
};

export const suggestedCaptions = [
  "Découvrez comment ce format transforme l'engagement en moins de 15 secondes.",
  "Une astuce rapide pour booster vos ventes avec un storytelling visuel.",
  "Storytelling authentique + appel à l'action clair = contenu gagnant."
];

export const suggestedHashtags = [
  '#MarketingDigital',
  '#TikTokPro',
  '#Engagement',
  '#StratégieDeContenu'
];

export const suggestedIdeas = [
  'Créer une série “Avant / Après” pour mettre en valeur un produit.',
  'Partager un témoignage client en story courte.',
  'Poster un teaser éducatif sur une astuce métier.',
  'Faire un format “Behind the scenes” pour renforcer la confiance.'
];

export const suggestedTips = [
  'Utilisez des premiers 3 secondes forts pour retenir l’audience.',
  'Ajoutez un CTA clair en fin de vidéo pour encourager l’action.',
  'Testez 2 à 3 hashtags de niche et 1 hashtag de tendance.',
  'Publiez aux heures de forte activité de votre communauté.'
];

export const initialNotifications = [
  {
    id: 'notif-01',
    type: 'like',
    title: 'Votre post a dépassé 12,4k vues',
    detail: 'Le post “Lancement express de produit” reçoit un très bon engagement.',
    time: '2h'
  },
  {
    id: 'notif-02',
    type: 'comment',
    title: 'Nouveau commentaire sur votre publication',
    detail: 'Lina M. a commenté “J’adore ce format, c’est parfait”.',
    time: '5h'
  },
  {
    id: 'notif-03',
    type: 'reminder',
    title: 'Story planifiée dans 1h',
    detail: 'La story lifestyle sera publiée automatiquement à l’heure prévue.',
    time: '1j'
  },
  {
    id: 'notif-04',
    type: 'suggestion',
    title: 'Idée de contenu recommandée',
    detail: 'Publiez un format “avant / après” cette semaine pour améliorer la portée.',
    time: '3j'
  }
];

export const initialPosts = [
  {
    id: 'tiktok-pub-01',
    type: 'post',
    mediaType: 'video',
    title: 'Lancement express de produit',
    caption: 'La tendance du jour : un reveal produit en 15 secondes avec appel à l’action. 🚀',
    prompt: 'product reveal video',
    mode: 'ai',
    status: 'published',
    visibility: 'public',
    createdAt: offsetDate(2, 3),
    updatedAt: offsetDate(1, 20),
    publishedAt: offsetDate(2, 2),
    scheduledAt: null,
    deletedAt: null,
    contentPreview:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
    mediaName: 'AI generated video',
    metrics: {
      likes: 1840,
      comments: 68,
      shares: 42,
      reach: 12400,
      impressions: 17100,
      profileVisits: 520
    },
    commentsCount: 6
  },
  {
    id: 'tiktok-pub-02',
    type: 'story',
    mediaType: 'photo',
    title: 'Story produit lifestyle',
    caption: 'Une clôture simple, authentique et très visuelle pour capturer l’attention.',
    prompt: 'story photo lifestyle',
    mode: 'manual',
    status: 'published',
    visibility: 'public',
    createdAt: offsetDate(1, 16),
    updatedAt: offsetDate(1, 15),
    publishedAt: offsetDate(1, 15),
    scheduledAt: null,
    deletedAt: null,
    contentPreview:
      'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=900&q=80',
    mediaName: 'Uploaded photo',
    metrics: {
      likes: 980,
      comments: 24,
      shares: 18,
      reach: 7600,
      impressions: 9400,
      profileVisits: 260
    },
    commentsCount: 2
  },
  {
    id: 'tiktok-sched-01',
    type: 'post',
    mediaType: 'photo',
    title: 'Aperçu teaser',
    caption: 'Teaser photo pour annoncer une nouvelle série de contenus premium.',
    prompt: 'teaser photo for launch',
    mode: 'manual',
    status: 'scheduled',
    visibility: 'public',
    createdAt: offsetDate(1, 2),
    updatedAt: offsetDate(1, 2),
    publishedAt: null,
    scheduledAt: offsetDate(-1, 8),
    deletedAt: null,
    contentPreview:
      'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=900&q=80',
    mediaName: 'Upload',
    metrics: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      profileVisits: 0
    },
    commentsCount: 0
  },
  {
    id: 'tiktok-draft-01',
    type: 'post',
    mediaType: 'video',
    title: 'Brouillon annonce atelier',
    caption: 'Restez connecté pour notre atelier marketing. Enregistrer la date et préparer le CTA.',
    prompt: 'workshop announcement',
    mode: 'manual',
    status: 'draft',
    visibility: 'private',
    createdAt: offsetDate(0, 6),
    updatedAt: offsetDate(0, 6),
    publishedAt: null,
    scheduledAt: null,
    deletedAt: null,
    contentPreview:
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=900&q=80',
    mediaName: 'Draft media',
    metrics: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      profileVisits: 0
    },
    commentsCount: 0
  },
  {
    id: 'tiktok-archived-01',
    type: 'post',
    mediaType: 'photo',
    title: 'Contenu evergreen archivé',
    caption: 'Post archivé qui était performant et reste disponible pour repenser plus tard.',
    prompt: 'archive evergreen content',
    mode: 'manual',
    status: 'archived',
    visibility: 'public',
    createdAt: offsetDate(7, 4),
    updatedAt: offsetDate(7, 4),
    publishedAt: offsetDate(7, 3),
    scheduledAt: null,
    deletedAt: null,
    contentPreview:
      'https://images.unsplash.com/photo-1517511620798-cec17d428bc0?auto=format&fit=crop&w=900&q=80',
    mediaName: 'Archived image',
    metrics: {
      likes: 1200,
      comments: 34,
      shares: 20,
      reach: 9800,
      impressions: 12100,
      profileVisits: 300
    },
    commentsCount: 4
  },
  {
    id: 'tiktok-trash-01',
    type: 'story',
    mediaType: 'video',
    title: 'Story supprimée',
    caption: 'Cette story a été déplacée vers la corbeille ; elle sera supprimée automatiquement après 30 jours.',
    prompt: 'discarded story',
    mode: 'manual',
    status: 'trash',
    visibility: 'private',
    createdAt: offsetDate(10, 5),
    updatedAt: offsetDate(10, 4),
    publishedAt: null,
    scheduledAt: null,
    deletedAt: offsetDate(10, 4),
    contentPreview:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    mediaName: 'Deleted preview',
    metrics: {
      likes: 0,
      comments: 0,
      shares: 0,
      reach: 0,
      impressions: 0,
      profileVisits: 0
    },
    commentsCount: 0
  }
];

export const initialComments = [
  {
    id: 'comment-01',
    postId: 'tiktok-pub-01',
    author: 'Lina M.',
    text: 'J’adore ce format, c’est parfait pour notre audience.',
    status: 'approved',
    createdAt: offsetDate(2, 1)
  },
  {
    id: 'comment-02',
    postId: 'tiktok-pub-01',
    author: 'Noah R.',
    text: 'Est-ce qu’on peut republier ce type de contenu dans 24h ?',
    status: 'approved',
    createdAt: offsetDate(1, 22)
  },
  {
    id: 'comment-03',
    postId: 'tiktok-pub-02',
    author: 'Camille D.',
    text: 'Cette story est super engageante.',
    status: 'hidden',
    createdAt: offsetDate(1, 18)
  },
  {
    id: 'comment-04',
    postId: 'tiktok-pub-02',
    author: 'Amir B.',
    text: 'Trop de texte sur la miniature, à simplifier.',
    status: 'approved',
    createdAt: offsetDate(1, 16)
  },
  {
    id: 'comment-05',
    postId: 'tiktok-archived-01',
    author: 'Sophie G.',
    text: 'Je trouve ça trop promotionnel, cacher peut-être.',
    status: 'deleted',
    createdAt: offsetDate(7, 3)
  }
];