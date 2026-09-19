import { Router, type Request, type Response } from 'express';
import { getUser, requireUser } from '../services/session.js';
import * as db from '../services/data.js';

const router = Router();

function sanitizeJastiper(j: any) {
  if (!j) return j;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { kycKtpUrl, kycSelfieUrl, ...safe } = j;
  return safe;
}

// GET /api/jastipers — list jastipers with filters (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { area, sort, search, lat, lng } = req.query;
    const jastipers = await db.listJastipers({
      area: area ? String(area) : undefined,
      sort: sort ? String(sort) : undefined,
      search: search ? String(search) : undefined,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
    });
    res.json({ jastipers: jastipers.map(sanitizeJastiper) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat jastiper' });
  }
});

// GET /api/jastipers/popular
router.get('/popular', async (_req: Request, res: Response) => {
  try {
    const jastipers = await db.listJastipers({ sort: 'rating' });
    res.json({ jastipers: jastipers.slice(0, 10).map(sanitizeJastiper) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat jastiper populer' });
  }
});

// GET /api/jastipers/newest
router.get('/newest', async (_req: Request, res: Response) => {
  try {
    const jastipers = await db.listJastipers({ sort: 'newest' });
    res.json({ jastipers: jastipers.slice(0, 10).map(sanitizeJastiper) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat jastiper terbaru' });
  }
});

// GET /api/jastipers/nearby
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    const jastipers = await db.listJastipers({
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
    });
    res.json({ jastipers: jastipers.map(sanitizeJastiper) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat jastiper terdekat' });
  }
});

// GET /api/jastipers/me — profil jastiper saya sendiri (driver only)
router.get('/me', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const jastiper = await db.getJastiper(user.id);
    if (!jastiper) {
      return res
        .status(404)
        .json({ message: 'Kamu belum terdaftar sebagai jastiper', isJastiper: false });
    }
    res.json({ jastiper, isJastiper: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat profil jastiper' });
  }
});

// POST /api/jastipers/register — daftar sebagai jastiper (driver app)
router.post('/register', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const body = req.body ?? { /* ignore */ };
    if (!body.name && !user.name) {
      return res.status(400).json({ message: 'Nama jastiper wajib diisi' });
    }
    // Validasi flatOngkir (max 25.000)
    let flatOngkir = Number(body.flatOngkir ?? 10000);
    if (isNaN(flatOngkir) || flatOngkir < 0) flatOngkir = 10000;
    if (flatOngkir > 25000) flatOngkir = 25000;

    const jastiper = await db.upsertJastiper(user.id, {
      name: body.name || user.name,
      bio: body.bio ?? '',
      photoUrl: body.photoUrl ?? user.photoUrl ?? '',
      coverUrl: body.coverUrl ?? '',
      area: body.area ?? '',
      category: body.category ?? 'Umum',
      feeEstimate: body.feeEstimate ?? '',
      flatOngkir,
      isJastipActive: true,
      openTripTitle: body.openTripTitle ?? '',
      openTripDestination: body.openTripDestination ?? '',
      openTripSchedule: body.openTripSchedule ?? '',
      openTripClosing: body.openTripClosing ?? '',
    });
    res.status(201).json({ jastiper });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal mendaftar sebagai jastiper' });
  }
});

// PUT /api/jastipers/me — update profil & trip jastiper (driver app)
router.put('/me', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const body = req.body ?? { /* ignore */ };
    if (body.flatOngkir !== undefined) {
      let flat = Number(body.flatOngkir);
      if (isNaN(flat) || flat < 0) flat = 10000;
      if (flat > 25000) flat = 25000;
      body.flatOngkir = flat;
    }
    const jastiper = await db.upsertJastiper(user.id, body);
    res.json({ jastiper });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memperbarui profil jastiper' });
  }
});

// GET /api/jastipers/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const jastiper = await db.getJastiper(req.params.id);
    if (!jastiper) return res.status(404).json({ message: 'Jastiper tidak ditemukan' });
    res.json({ jastiper: sanitizeJastiper(jastiper) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat detail jastiper' });
  }
});

// GET /api/jastipers/:id/products
router.get('/:id/products', async (req: Request, res: Response) => {
  try {
    const products = await db.listJastipProducts(req.params.id);
    res.json({ products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat produk jastip' });
  }
});

export default router;


