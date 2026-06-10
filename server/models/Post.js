const mongoose = require('mongoose');

const mediaPostSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'carousel', 'reel', 'story', 'text'], default: 'image' },
    ordre: { type: Number, default: 0 },
  },
  { _id: true }
);

const postsStatsSchema = new mongoose.Schema(
  {
    publication: { type: Number, default: 0 },
    planification: { type: Number, default: 0 },
    brouillon: { type: Number, default: 0 },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    id_utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    id_plateforme: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform', required: true },
    contenu: { type: String, default: '' },
    description: { type: String, default: '' },
    hashtags: { type: String, default: '' },
    statut: {
      type: String,
      enum: ['brouillon', 'planifie', 'publie'],
      default: 'brouillon',
    },
    source: {
      type: String,
      enum: ['manuel', 'ai'],
      default: 'manuel',
    },
    date_planification: { type: Date },
    type: { type: String, default: 'image' },
    medias: [mediaPostSchema],
    stats: { type: postsStatsSchema, default: () => ({}) },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
