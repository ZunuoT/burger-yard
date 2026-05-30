const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️  MongoDB not available - using in-memory data`);
    console.error(`❌ MongoDB Error: ${error.message}`);
  }
};

module.exports = connectDB;
