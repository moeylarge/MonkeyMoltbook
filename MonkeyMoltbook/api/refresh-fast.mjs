import app from '../apps/server/src/app.js';

export default async function handler(req, res) {
  req.url = '/moltbook/refresh?mode=fast&source=vercel-cron';
  req.method = 'POST';
  return app(req, res);
}
