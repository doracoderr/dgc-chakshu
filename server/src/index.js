require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Render (and similar free hosts) auto-sleep the service after ~15 min of
// no incoming HTTP traffic. Pinging our own /api/health endpoint every
// 10 minutes keeps the instance awake. RENDER_EXTERNAL_URL is set
// automatically by Render; SELF_URL is a manual fallback for other hosts.
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const startSelfPing = () => {
  const selfUrl = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL;
  if (!selfUrl) {
    console.log('Self-ping skipped: RENDER_EXTERNAL_URL / SELF_URL not set');
    return;
  }

  const healthUrl = `${selfUrl.replace(/\/$/, '')}/api/health`;

  setInterval(() => {
    fetch(healthUrl)
      .then((res) => console.log(`[self-ping] ${res.status} ${healthUrl}`))
      .catch((err) => console.error('[self-ping] failed:', err.message));
  }, PING_INTERVAL_MS);

  console.log(`Self-ping enabled: pinging ${healthUrl} every 10 minutes`);
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startSelfPing();
  });
});
