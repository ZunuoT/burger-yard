const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, enum: ['burger', 'combo', 'sides', 'drinks'] },
  image: { type: String, default: '' },
  badge: { type: String, default: null },
  available: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  spicy: { type: Boolean, default: false },
  calories: { type: Number, default: null },
  tags: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
