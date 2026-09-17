import { Router, type Request, type Response } from 'express';
import { geocode, reverseGeocode, searchRecommendations, hitungJarak } from '../services/distance.js';

const router = Router();

// GET /api/geocode?q=
router.get('/api/geocode', async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) return res.status(400).json({ message: 'Query q wajib diisi' });
  const result = await geocode(q);
  res.json({ result });
});

// GET /api/reverse-geocode?lat=&lng=
router.get('/api/reverse-geocode', async (req: Request, res: Response) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ message: 'lat & lng wajib angka' });
  }
  const result = await reverseGeocode(lat, lng);
  res.json({ result });
});

// GET /api/distance?fromLat=&fromLng=&toLat=&toLng=
router.get('/api/distance', async (req: Request, res: Response) => {
  const fromLat = Number(req.query.fromLat);
  const fromLng = Number(req.query.fromLng);
  const toLat = Number(req.query.toLat);
  const toLng = Number(req.query.toLng);
  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
    return res.status(400).json({ message: 'fromLat/fromLng/toLat/toLng wajib angka' });
  }
  const result = await hitungJarak({ fromLat, fromLng, toLat, toLng });
  res.json(result); // { jarakKm, estimasiMenit, routePoints }
});

// GET /api/places/search?q=&lat=&lng=
router.get('/api/places/search', async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined;
  const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined;
  if (!q) return res.json({ results: [] });
  const results = await searchRecommendations({
    query: q,
    lat: lat !== undefined && Number.isFinite(lat) ? lat : undefined,
    lng: lng !== undefined && Number.isFinite(lng) ? lng : undefined,
  });
  res.json({ results });
});

export default router;