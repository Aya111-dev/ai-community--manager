const mongoose = require('mongoose');

const platformSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique: true, trim: true, lowercase: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Platform', platformSchema);
