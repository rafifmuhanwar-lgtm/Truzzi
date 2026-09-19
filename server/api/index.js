import app from '../dist/index.js';
export default function (req, res) {
  if (!req.url.startsWith('/api') && req.url !== '/uploads') {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  return app(req, res);
}
