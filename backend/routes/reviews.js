const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

let inMemoryReviews = [
  { _id: 'r1', name: 'Kwame Asante', level: 'Engineering, Level 300', rating: 5, comment: 'Best burger on campus, no debate. The Yard Smash with extra sauce is absolutely fire. I come here after every exam — it\'s my reward system.', approved: true, createdAt: new Date('2025-03-01') },
  { _id: 'r2', name: 'Abena Boateng', level: 'Business School, Level 200', rating: 5, comment: 'The loaded fries are absolutely insane. Cheese, sauce, the works. And they\'re always hot and fresh. Burger Yard never disappoints — been coming since first year!', approved: true, createdAt: new Date('2025-03-15') },
  { _id: 'r3', name: 'Ebo Owusu', level: 'Science, Level 400', rating: 4, comment: 'Fast, affordable, tastes great. The student combo is hands down the best deal on campus. Burger Yard understands the student struggle and delivers every time.', approved: true, createdAt: new Date('2025-04-02') },
  { _id: 'r4', name: 'Maame Serwaa', level: 'Architecture, Level 300', rating: 5, comment: 'Love the Crispy Chicken burger! The honey mustard sauce is addictive. Highly recommend to anyone near Lienda Ville.', approved: true, createdAt: new Date('2025-04-20') },
];

const isDBConnected = () => {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
};

// GET approved reviews (public)
router.get('/', async (req, res) => {
  try {
    if (isDBConnected()) {
      const reviews = await Review.find({ approved: true }).sort({ createdAt: -1 });
      return res.json({ success: true, data: reviews });
    }
    res.json({ success: true, data: inMemoryReviews.filter(r => r.approved) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST submit review (public)
router.post('/', async (req, res) => {
  try {
    const { name, level, rating, comment } = req.body;
    if (!name || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Name, rating and comment are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be 1-5' });
    }

    if (isDBConnected()) {
      const review = await Review.create({ name, level, rating, comment, approved: false });
      return res.status(201).json({ success: true, data: review, message: 'Review submitted! Pending approval.' });
    }
    const review = { _id: `r${Date.now()}`, name, level, rating, comment, approved: false, createdAt: new Date() };
    inMemoryReviews.push(review);
    res.status(201).json({ success: true, data: review, message: 'Review submitted! Pending approval.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH approve review (admin)
router.patch('/:id/approve', protect, async (req, res) => {
  try {
    if (isDBConnected()) {
      const review = await Review.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
      if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
      return res.json({ success: true, data: review });
    }
    const review = inMemoryReviews.find(r => r._id === req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    review.approved = true;
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
