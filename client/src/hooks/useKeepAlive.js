import { useEffect } from 'react';
import api from '../api/axios';

// Backup keep-alive: while the site is open in a tab, ping the backend's
// health endpoint every 10 minutes. This is a fallback for the backend's
// own self-ping (e.g. if the backend host doesn't expose a public URL to
// itself), so cold starts are less likely when a real user is Browse.
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export default function useKeepAlive() {
  useEffect(() => {
    const ping = () => {
      api.get('/health').catch(() => {
        // Silently ignore — this is just a keep-alive, not a real request.
      });
    };

    // one immediate ping on load, then every 10 minutes
    ping();
    const intervalId = setInterval(ping, PING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);
}
