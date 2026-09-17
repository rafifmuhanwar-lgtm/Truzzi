import { Router, type Request, type Response } from 'express';
import { getUser, requireUser } from '../services/session.js';
import * as db from '../services/data.js';

const router = Router();

function sanitizeJastiper(j: any) {
  if (!j) return j;
  const { kycKtpUrl, kycSelfieUrl, ...safe } = j;
  return safe;
}

// GET /api/favorites — daftar jastiper favorite user
router.get('/', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const favs = await db.listFavorites(user.id);
    const favorites = favs.map((f) => f.jastiper).filter(Boolean).map(sanitizeJastiper);
    res.json({ favorites });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat daftar favorite' });
  }
});

// POST /api/favorites — tambah jastiper ke favorite
router.post('/', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const { jastiperId } = req.body ?? {};
    if (!jastiperId) return res.status(400).json({ message: 'jastiperId wajib diisi' });
    const fav = await db.addFavorite(user.id, String(jastiperId));
    res.status(201).json({ favorite: fav });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal menambahkan favorite' });
  }
});

// DELETE /api/favorites/:id — hapus dari favorite
router.delete('/:id', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    await db.removeFavorite(user.id, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal menghapus favorite' });
  }
});

// GET /api/favorites/check/:jastiperId
router.get('/check/:jastiperId', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const isFav = await db.checkFavorite(user.id, req.params.jastiperId);
    res.json({ isFavorite: isFav });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memeriksa status favorite' });
  }
});

export default router;
