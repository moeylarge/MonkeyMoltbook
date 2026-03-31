import app from '../apps/server/src/app.js';

export default function handler(req, res) {
  req.url = String(req.url || '').replace(/^\/api(?=\/|$)/, '') || '/';
  return app(req, res);
}
