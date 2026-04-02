import app from './index.mjs';

export default async function handler(req, res) {
  req.url = '/moltbook/reindex/search?source=vercel-cron';
  return app(req, res);
}
