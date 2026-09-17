import { Router, type Request, type Response } from 'express';
import { getUser, requireUser } from '../services/session.js';
import * as db from '../services/data.js';

const router = Router();

// GET /api/jastip-products — list produk milik jastiper yang login (driver app)
router.get('/', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const products = await db.listMyJastipProducts(user.id);
    res.json({ products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat produk jastip' });
  }
});

// POST /api/jastip-products — buat produk jastip baru
router.post('/', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const body = req.body ?? {};
    if (!body.title || body.price === undefined) {
      return res.status(400).json({ message: 'Judul dan harga wajib diisi' });
    }

    // Pastikan jastiper profil sudah ada; jika belum, auto-register dengan data kurir
    let jastiper = await db.getJastiper(user.id);
    if (!jastiper) {
      jastiper = await db.upsertJastiper(user.id, {
        name: user.name,
        photoUrl: user.photoUrl ?? '',
        area: user.selectedArea ?? '',
        isJastipActive: true,
      });
    }

    const product = await db.createJastipProduct({
      jastiperId: jastiper.id || user.id,
      title: body.title,
      description: body.description ?? '',
      price: Number(body.price) || 0,
      category: body.category ?? 'Umum',
      images: body.images ?? [],
      published: body.published ?? true,
      status: body.status ?? 'active',
    });
    res.status(201).json({ product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal membuat produk jastip' });
  }
});

// PATCH /api/jastip-products/:id — update produk jastip
router.patch('/:id', requireUser, async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const product = await db.updateJastipProduct(req.params.id, body);
    res.json({ product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal mengupdate produk jastip' });
  }
});

// DELETE /api/jastip-products/:id — hapus produk jastip
router.delete('/:id', requireUser, async (req: Request, res: Response) => {
  try {
    await db.deleteJastipProduct(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal menghapus produk jastip' });
  }
});

// POST /api/jastip-products/:id/toggle-publish — ubah status publish produk
router.post('/:id/toggle-publish', requireUser, async (req: Request, res: Response) => {
  try {
    const product = await db.togglePublishJastipProduct(req.params.id);
    res.json({ product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal mengubah status publikasi produk' });
  }
});

export default router;

