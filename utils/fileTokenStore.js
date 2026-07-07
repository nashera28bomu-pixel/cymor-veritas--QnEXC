const { nanoid } = require('nanoid');

const store = new Map(); // token -> { fileId, fileName, telegramId, createdAt }
const TTL_MS = 10 * 60 * 1000; // 10 minutes — plenty for picking a menu option

function save(fileId, fileName, telegramId) {
  const token = nanoid(8);
  store.set(token, { fileId, fileName, telegramId, createdAt: Date.now() });
  return token;
}

function get(token) {
  const entry = store.get(token);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(token);
    return null;
  }
  return entry;
}

// Periodic cleanup so this doesn't grow unbounded on a long-running process
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of store.entries()) {
    if (now - entry.createdAt > TTL_MS) store.delete(token);
  }
}, 60 * 1000);

module.exports = { save, get };
