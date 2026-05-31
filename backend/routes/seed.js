const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const Review = require('../models/Review');
const bcrypt = require('bcryptjs');

const MENU_ITEMS = [
  { name: 'THE YARD SMASH', description: 'Double smashed patty, yard sauce, caramelised onions, American cheese, pickles on a toasted brioche bun.', price: 45, category: 'burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=420&fit=crop', badge: 'Best Seller', featured: true, available: true },
  { name: 'SPICY HABANERO', description: 'Single patty with habanero mayo, jalapeños, pepper jack cheese, fresh lettuce and tomato.', price: 42, category: 'burger', image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&h=420&fit=crop', badge: 'Spicy 🌶️', spicy: true, available: true },
  { name: 'CRISPY CHICKEN', description: 'Buttermilk-brined crispy chicken fillet, coleslaw, pickles, honey mustard on a soft sesame bun.', price: 40, category: 'burger', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&h=420&fit=crop', badge: 'New', available: true },
  { name: 'THE CLASSIC', description: 'Single beef patty, ketchup, mustard, onion, lettuce and tomato. Simple. Perfect. Classic.', price: 32, category: 'burger', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&h=420&fit=crop', badge: null, available: true },
  { name: 'MUSHROOM MELT', description: 'Beef patty topped with sautéed mushrooms, caramelised onions and Swiss cheese. Rich and savoury.', price: 48, category: 'burger', image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&h=420&fit=crop', badge: null, available: true },
  { name: 'STUDENT COMBO', description: 'Any burger + regular fries + drink of your choice. Show KNUST ID for the deal.', price: 55, category: 'combo', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=420&fit=crop', badge: 'Student Deal', featured: true, available: true },
  { name: 'DOUBLE DOWN COMBO', description: 'Double Smash burger + loaded fries + large drink. For the seriously hungry student.', price: 72, category: 'combo', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&h=420&fit=crop', badge: 'Value', available: true },
  { name: 'STUDY BREAK BOX', description: '2 Classic burgers + 2 regular fries + 2 drinks. Perfect for you and a study buddy.', price: 115, category: 'combo', image: 'https://images.unsplash.com/photo-1566187282610-8ae16c7254f8?w=600&h=420&fit=crop', badge: 'For Two', available: true },
  { name: 'LOADED FRIES', description: 'Thick-cut fries smothered in yard cheese sauce, chilli flakes and spring onion. Addictive.', price: 22, category: 'sides', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=420&fit=crop', badge: 'Must Try', featured: true, available: true },
  { name: 'REGULAR FRIES', description: 'Fresh-cut, seasoned with the signature Yard spice blend. Crispy outside, fluffy inside.', price: 15, category: 'sides', image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&h=420&fit=crop', badge: null, available: true },
  { name: 'ONION RINGS', description: 'Golden battered onion rings with a light, crunchy coating. Served with dipping sauce.', price: 18, category: 'sides', image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&h=420&fit=crop', badge: null, available: true },
  { name: 'CHILLED SOBOLO', description: 'House-made hibiscus flower drink, lightly sweetened and perfectly chilled. Refreshing.', price: 10, category: 'drinks', image: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=600&h=420&fit=crop', badge: 'Local Fav', available: true },
  { name: 'FRESH ZOBO LEMONADE', description: 'Zobo blended with fresh lemon and a hint of ginger. Unique and utterly refreshing.', price: 12, category: 'drinks', image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&h=420&fit=crop', badge: 'New', available: true },
  { name: 'SODA / BOTTLED WATER', description: 'Assorted sodas and water to wash down your meal.', price: 6, category: 'drinks', image: 'https://images.unsplash.com/photo-1543253687-c931c8e01820?w=600&h=420&fit=crop', badge: null, available: true },
];

const REVIEWS = [
  { name: 'Kwame Asante', level: 'Engineering, Level 300', rating: 5, comment: "Best burger on campus, no debate. The Yard Smash with extra sauce is absolutely fire.", approved: true },
  { name: 'Abena Boateng', level: 'Business School, Level 200', rating: 5, comment: "The loaded fries are absolutely insane. Burger Yard never disappoints!", approved: true },
  { name: 'Ebo Owusu', level: 'Science, Level 400', rating: 4, comment: 'Fast, affordable, tastes great. The student combo is the best deal on campus.', approved: true },
  { name: 'Maame Serwaa', level: 'Architecture, Level 300', rating: 5, comment: 'Love the Crispy Chicken burger! The honey mustard sauce is addictive.', approved: true },
];

router.get('/', async (req, res) => {
  // Respond immediately so the request doesn't time out
  res.json({ success: true, message: 'Seeding started — refresh the site in 10 seconds' });

  // Do the actual seeding after responding
  try {
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      await MenuItem.insertMany(MENU_ITEMS);
      console.log('✅ Menu seeded');
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // Hash password manually to avoid timeout
      const hashed = await bcrypt.hash('admin123', 10);
      await User.collection.insertOne({
        name: 'Admin',
        email: 'admin@burgeryard.com',
        password: hashed,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Admin user seeded');
    }

    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      await Review.insertMany(REVIEWS);
      console.log('✅ Reviews seeded');
    }

    console.log('✅ Database seeding complete');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  }
});

module.exports = router;
