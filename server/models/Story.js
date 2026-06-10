const mongoose = require('mongoose');

const mediaStorySchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    ordre: { type: Number, default: 0 },
  },
  { _id: true }
);

const storiesStatsSchema = new mongoose.Schema(
  {
    publication: { type: Number, default: 0 },
    planification: { type: Number, default: 0 },
    brouillon: { type: Number, default: 0 },
  },
  { _id: false }
);

const storySchema = new mongoose.Schema(
  {
    id_utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    id_plateforme: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform', required: true },
    contenu: { type: String, default: '' },
    description: { type: String, default: '' },
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
    medias: [mediaStorySchema],
    stats: { type: storiesStatsSchema, default: () => ({}) },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Story', storySchema);
