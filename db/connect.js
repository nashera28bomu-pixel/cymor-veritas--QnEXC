const mongoose = require('mongoose');
const config = require('../config');

async function connectDB(retries = 5, delayMs = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(config.mongoUri);
      console.log('[DB] MongoDB connected.');
      return;
    } catch (err) {
      console.error(`[DB] Connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) {
        console.error('[DB] Exhausted retries. Exiting.');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] Disconnected. Attempting to reconnect...');
  connectDB(10, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] Connection error:', err.message);
});

module.exports = connectDB;
