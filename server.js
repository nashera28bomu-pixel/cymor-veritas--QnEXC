const express = require('express');
const cron = require('node-cron');
const axios = require('axios');
const config = require('./config');

function startServer() {
  const app = express();

  app.get('/', (req, res) => res.send('Cymor Convert Bot is running.'));
  app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  const server = app.listen(config.port, () => {
    console.log(`[Server] Listening on port ${config.port}`);
  });

  // Self-ping every 10 minutes to prevent Render free-tier spin-down.
  // Render's free web services sleep after 15 min of no HTTP traffic — this keeps traffic flowing.
  if (config.externalUrl) {
    cron.schedule('*/10 * * * *', async () => {
      try {
        await axios.get(`${config.externalUrl}/health`, { timeout: 10000 });
        console.log('[KeepAlive] Self-ping successful.');
      } catch (err) {
        console.warn('[KeepAlive] Self-ping failed:', err.message);
      }
    });
  } else {
    console.warn('[KeepAlive] RENDER_EXTERNAL_URL not set — self-ping disabled. Set it in your env vars to prevent free-tier sleep.');
  }

  return server;
}

module.exports = startServer;
