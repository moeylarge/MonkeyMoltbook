import app from './index.mjs';

export default async function handler(req, res) {
  req.url = '/moltbook/collect/rolling?perPage=100&source=vercel-cron';
  return app(req, res);
}
