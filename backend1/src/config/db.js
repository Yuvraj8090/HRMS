// src/config/db.js
import mongoose from 'mongoose';
export const connectDB = async () => {
  try {
    const c = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB: ${c.connection.host}`);
    process.on('SIGINT', async () => { await mongoose.connection.close(); process.exit(0); });
  } catch (e) { console.error('❌ MongoDB failed:', e.message); process.exit(1); }
};
