// models/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  assessorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' },
  comments: { type: String },
  status: { type: String, enum: ['approved', 'revisions needed', 'pending'], default: 'pending' },
  reviewedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Review', ReviewSchema);
