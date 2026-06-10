const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
