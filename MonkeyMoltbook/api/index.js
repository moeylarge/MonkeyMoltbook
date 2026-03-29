import app from '../apps/server/src/app.js';

export default function handler(req, res) {
  return app(req, res);
}
