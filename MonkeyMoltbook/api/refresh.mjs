import app from '../apps/server/src/app.js';

export default async function handler(req, res) {
  req.url = '/moltbook/refresh';
  req.method = 'POST';
  return app(req, res);
}
