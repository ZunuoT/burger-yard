const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { protect } = require('../middleware/auth');

// In-memory fallback data
const SEED_MENU = [
  { name: 'THE YARD SMASH', description: 'Double smashed patty, yard sauce, caramelised onions, American cheese, pickles on a toasted brioche bun.', price: 45, category: 'burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=420&fit=crop', badge: 'Best Seller', featured: true },
  { name: 'SPICY HABANERO', description: 'Single patty with habanero mayo, jalapeños, pepper jack cheese, fresh lettuce and tomato.', price: 42, category: 'burger', image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&h=420&fit=crop', badge: 'Spicy 🌶️', spicy: true },
  { name: 'CRISPY CHICKEN', description: 'Buttermilk-brined crispy chicken fillet, coleslaw, pickles, honey mustard on a soft sesame bun.', price: 40, category: 'burger', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&h=420&fit=crop', badge: 'New' },
  { name: 'THE CLASSIC', description: 'Single beef patty, ketchup, mustard, onion, lettuce and tomato. Simple. Perfect. Classic.', price: 32, category: 'burger', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&h=420&fit=crop', badge: null },
  { name: 'MUSHROOM MELT', description: 'Beef patty topped with sautéed mushrooms, caramelised onions and Swiss cheese. Rich and savoury.', price: 48, category: 'burger', image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&h=420&fit=crop', badge: null },
  { name: 'STUDENT COMBO', description: 'Any burger + regular fries + drink of your choice. Show KNUST ID for the deal.', price: 55, category: 'combo', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=420&fit=crop', badge: 'Student Deal', featured: true },
  { name: 'DOUBLE DOWN COMBO', description: 'Double Smash burger + loaded fries + large drink. For the seriously hungry student.', price: 72, category: 'combo', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&h=420&fit=crop', badge: 'Value' },
  { name: 'STUDY BREAK BOX', description: '2 Classic burgers + 2 regular fries + 2 drinks. Perfect for you and a study buddy.', price: 115, category: 'combo', image: 'https://images.unsplash.com/photo-1566187282610-8ae16c7254f8?w=600&h=420&fit=crop', badge: 'For Two' },
  { name: 'LOADED FRIES', description: 'Thick-cut fries smothered in yard cheese sauce, chilli flakes and spring onion. Addictive.', price: 22, category: 'sides', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=420&fit=crop', badge: 'Must Try', featured: true },
  { name: 'REGULAR FRIES', description: 'Fresh-cut, seasoned with the signature Yard spice blend. Crispy outside, fluffy inside.', price: 15, category: 'sides', image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&h=420&fit=crop', badge: null },
  { name: 'ONION RINGS', description: 'Golden battered onion rings with a light, crunchy coating. Served with dipping sauce.', price: 18, category: 'sides', image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&h=420&fit=crop', badge: null },
  { name: 'CHILLED SOBOLO', description: 'House-made hibiscus flower drink, lightly sweetened and perfectly chilled. Refreshing.', price: 10, category: 'drinks', image: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=600&h=420&fit=crop', badge: 'Local Fav' },
  { name: 'FRESH ZOBO LEMONADE', description: 'Zobo blended with fresh lemon and a hint of ginger. Unique and utterly refreshing.', price: 12, category: 'drinks', image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&h=420&fit=crop', badge: 'New' },
  { name: 'SODA / BOTTLED WATER', description: 'Assorted sodas and water to wash down your meal.', price: 6, category: 'drinks', image: 'https://images.unsplash.com/photo-1543253687-c931c8e01820?w=600&h=420&fit=crop', badge: null },
];

let inMemoryMenu = SEED_MENU.map((item, i) => ({ ...item, _id: `mem_${i + 1}`, available: true, createdAt: new Date() }));
let useDB = false;

// Check if DB is connected
const isDBConnected = () => {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
};

// GET all menu items
router.get('/', async (req, res) => {
  try {
    const { category, available } = req.query;
    if (isDBConnected()) {
      const filter = {};
      if (category) filter.category = category;
      if (available !== undefined) filter.available = available === 'true';
      const items = await MenuItem.find(filter).sort({ category: 1, createdAt: 1 });
      return res.json({ success: true, count: items.length, data: items });
    }
    // fallback
    let data = [...inMemoryMenu];
    if (category) data = data.filter(i => i.category === category);
    res.json({ success: true, count: data.length, data, source: 'memory' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single item
router.get('/:id', async (req, res) => {
  try {
    if (isDBConnected()) {
      const item = await MenuItem.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      return res.json({ success: true, data: item });
    }
    const item = inMemoryMenu.find(i => i._id === req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create item (admin)
router.post('/', protect, async (req, res) => {
  try {
    if (isDBConnected()) {
      const item = await MenuItem.create(req.body);
      return res.status(201).json({ success: true, data: item });
    }
    const newItem = { ...req.body, _id: `mem_${Date.now()}`, available: true, createdAt: new Date() };
    inMemoryMenu.push(newItem);
    res.status(201).json({ success: true, data: newItem });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update item (admin)
router.put('/:id', protect, async (req, res) => {
  try {
    if (isDBConnected()) {
      const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      return res.json({ success: true, data: item });
    }
    const idx = inMemoryMenu.findIndex(i => i._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Item not found' });
    inMemoryMenu[idx] = { ...inMemoryMenu[idx], ...req.body };
    res.json({ success: true, data: inMemoryMenu[idx] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE item (admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (isDBConnected()) {
      await MenuItem.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Item deleted' });
    }
    inMemoryMenu = inMemoryMenu.filter(i => i._id !== req.params.id);
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
