# 🍔 Burger Yard KNUST — Full Stack Website

A complete full-stack web application for Burger Yard, located near Lienda Ville Hostel, KNUST Campus, Kumasi Ghana.

---

## Tech Stack

| Layer     | Tech                              |
|-----------|-----------------------------------|
| Frontend  | Vanilla HTML/CSS/JS (no framework)|
| Backend   | Node.js + Express.js              |
| Database  | MongoDB (via Mongoose)            |
| Auth      | JWT (JSON Web Tokens)             |
| Security  | Helmet, CORS, Rate Limiting       |

---

## Project Structure

```
burger-yard/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   └── auth.js            # JWT auth middleware
│   ├── models/
│   │   ├── MenuItem.js        # Menu item schema
│   │   ├── Order.js           # Order schema
│   │   ├── Review.js          # Customer review schema
│   │   └── User.js            # Admin user schema
│   ├── routes/
│   │   ├── auth.js            # Login / me
│   │   ├── menu.js            # CRUD menu items
│   │   ├── orders.js          # Orders + tracking + stats
│   │   └── reviews.js         # Reviews + submission
│   ├── .env                   # Environment variables
│   └── server.js              # Express app entry point
└── frontend/
    └── public/
        └── index.html         # Full single-page frontend
```

---

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/burgeryard
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

### 3. Start the server

```bash
cd backend
node server.js
```

Visit: **http://localhost:5000**

> ✅ Works WITHOUT MongoDB — falls back to in-memory data automatically.

---

## API Endpoints

### Public
| Method | Endpoint                        | Description             |
|--------|---------------------------------|-------------------------|
| GET    | /api/menu                       | Get all menu items      |
| GET    | /api/menu?category=burger       | Filter by category      |
| POST   | /api/orders                     | Place a new order       |
| GET    | /api/orders/track/:orderNumber  | Track order by number   |
| GET    | /api/reviews                    | Get approved reviews    |
| POST   | /api/reviews                    | Submit a review         |
| GET    | /api/health                     | API health check        |

### Admin (requires JWT)
| Method | Endpoint                        | Description             |
|--------|---------------------------------|-------------------------|
| POST   | /api/auth/login                 | Admin login             |
| GET    | /api/orders                     | Get all orders          |
| GET    | /api/orders/stats/summary       | Dashboard stats         |
| PATCH  | /api/orders/:id/status          | Update order status     |
| POST   | /api/menu                       | Add menu item           |
| PUT    | /api/menu/:id                   | Update menu item        |
| DELETE | /api/menu/:id                   | Delete menu item        |

---

## Admin Dashboard

Login at: **http://localhost:5000** (click ⚙ in nav)

| Credential | Value                     |
|------------|---------------------------|
| Email      | admin@burgeryard.com      |
| Password   | admin123                  |

Features:
- 📊 Live order stats (total, pending, today, revenue)
- 📋 Orders table with real-time status update
- 🍔 Menu management view
- ⭐ Reviews moderation

---

## Features

### Customer-Facing
- 🍔 Live menu loaded from API with category filters
- 🛒 Cart with drawer, item modal, quantity control
- 📦 Order placement → auto-formatted WhatsApp message
- 📍 Order tracking by order number (e.g. BY-0001)
- ⭐ Review submission (pending approval)
- 📍 Location map (near Lienda Ville Hostel, KNUST)

### Admin
- 🔐 JWT-protected login
- 📊 Revenue + order count dashboard
- 🔄 Live order status updates (pending → confirmed → preparing → ready → delivered)
- 🍔 Menu item management

---

## Deployment

### Option 1: Render.com (Free)
1. Push to GitHub
2. Create new Web Service on render.com
3. Set root directory to `backend`
4. Start command: `node server.js`
5. Add env vars (MONGODB_URI from MongoDB Atlas, JWT_SECRET)

### Option 2: Railway.app
1. Connect GitHub repo
2. Add MongoDB plugin
3. Set environment variables

### MongoDB Atlas (Free cloud DB)
1. Create account at mongodb.com/atlas
2. Create free cluster
3. Get connection string
4. Set as MONGODB_URI in environment

---

## WhatsApp Integration

Update the phone number in `frontend/public/index.html`:

```js
window.open(`https://wa.me/233XXXXXXXXX?text=...`)
```

Replace `233XXXXXXXXX` with Burger Yard's WhatsApp number (country code + number, no spaces or +).

---

## License
Built for Burger Yard KNUST, Kumasi, Ghana 🇬🇭
