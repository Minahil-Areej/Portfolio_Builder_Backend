// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: Date, required: true },
  postcode: { type: String },
  qualification: { type: String },
  phone: { type: String },
  referenceNo: { type: String },
  role: { type: String, enum: ['student', 'admin', 'assessor'], required: true },
  image: { type: String }, // Path to the uploaded image
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
