import { Router } from 'express';
import * as db from '../services/data.js';
import { requireUser } from '../services/session.js';
import { getPrisma } from '../services/prisma-client.js';

const router = Router();

// GET /api/promos
router.get('/promos', async (_req, res) => {
  try {
    const promos = await db.listAllPromos();
    // In a real big tech system, we'd filter out inactive or expired promos here for the customer app,
    // but we can return all active ones for display.
    const activePromos = promos.filter((p: any) => p.active !== false);
    res.json({ promos: activePromos });
  } catch {
    res.status(500).json({ promos: [] });
  }
});

// POST /api/promos/validate
// Rule Engine for Promos
router.post('/promos/validate', requireUser, async (req: any, res: any) => {
  try {
    const { code, cartAmount, category } = req.body;


    if (!code) return res.status(400).json({ valid: false, message: 'Kode promo harus diisi' });

    // 1. Fetch promo by code
    const promos = await db.listAllPromos();
    const promo: any = promos.find((p: any) => p.code.toLowerCase() === code.toLowerCase());

    if (!promo) {
      return res.status(404).json({ valid: false, message: 'Kode promo tidak ditemukan' });
    }

    if (!promo.active) {
      return res.status(400).json({ valid: false, message: 'Promo ini sudah tidak aktif' });
    }

    // 2. Check Dates
    const now = new Date();
    if (promo.startDate && new Date(promo.startDate) > now) {
      return res.status(400).json({ valid: false, message: 'Promo belum dimulai' });
    }
    if (promo.endDate && new Date(promo.endDate) < now) {
      return res.status(400).json({ valid: false, message: 'Promo sudah kadaluarsa' });
    }

    // 3. Check Category
    if (promo.category && promo.category !== 'all' && category && promo.category !== category) {
      return res
        .status(400)
        .json({ valid: false, message: `Promo ini hanya berlaku untuk layanan ${promo.category}` });
    }

    // 4. Check Min Transaction
    const amount = Number(cartAmount) || 0;
    if (promo.minTransaction > 0 && amount < promo.minTransaction) {
      return res
        .status(400)
        .json({
          valid: false,
          message: `Minimal transaksi untuk promo ini adalah Rp ${promo.minTransaction}`,
        });
    }

    // 5. Check Quota & Budget
    if (promo.quota && promo.usedCount >= promo.quota) {
      return res
        .status(400)
        .json({ valid: false, message: 'Kuota promo ini sudah habis (Fully Redeemed)' });
    }

    // 6. Calculate Discount
    let discountAmount = 0;
    if (promo.type === 'discount' || promo.type === 'gratis_ongkir') {
      if (promo.discountPercent && promo.discountPercent > 0) {
        discountAmount = (amount * promo.discountPercent) / 100;
        if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
          discountAmount = promo.maxDiscount;
        }
      } else if (promo.discountFlat && promo.discountFlat > 0) {
        discountAmount = promo.discountFlat;
      }
    }

    // 7. Check if discount exceeds budgetMax
    if (promo.budgetMax && promo.budgetUsed + discountAmount > promo.budgetMax) {
      return res
        .status(400)
        .json({ valid: false, message: 'Anggaran promo ini sudah habis (Budget Exhausted)' });
    }

    return res.json({
      valid: true,
      message: 'Promo berhasil diaplikasikan!',
      discountAmount: Math.round(discountAmount),
      promoId: promo.$id || promo.id,
      promoDetails: {
        type: promo.type,
        title: promo.title,
      },
    });
  } catch (error: any) {
    console.error('Validate Promo Error:', error);
    res.status(500).json({ valid: false, message: 'Terjadi kesalahan server' });
  }
});

// POST /api/promos/claim
// Klaim promo untuk dimasukkan ke dompet promo user
router.post('/promos/claim', requireUser, async (req: any, res: any) => {
  try {
    const { code } = req.body;


    if (!code) return res.status(400).json({ success: false, message: 'Kode promo harus diisi' });

    const promos = await db.listAllPromos();
    const promo: any = promos.find((p: any) => p.code.toLowerCase() === code.toLowerCase());

    if (!promo) {
      return res.status(404).json({ success: false, message: 'Kode promo tidak ditemukan' });
    }

    if (!promo.active) {
      return res.status(400).json({ success: false, message: 'Promo ini sudah tidak aktif' });
    }

    // Check Dates
    const now = new Date();
    if (promo.startDate && new Date(promo.startDate) > now) {
      return res.status(400).json({ success: false, message: 'Promo belum dimulai' });
    }
    if (promo.endDate && new Date(promo.endDate) < now) {
      return res.status(400).json({ success: false, message: 'Promo sudah kadaluarsa' });
    }

    // Check if already claimed
    const existingClaim = await getPrisma().userPromo.findFirst({
      where: {
        userId,
        promoId: promo.id,
        orderId: null, // Unused claim
      },
    });

    if (existingClaim) {
      return res.status(400).json({ success: false, message: 'Anda sudah mengklaim voucher ini!' });
    }

    // Claim it
    await getPrisma().userPromo.create({
      data: {
        userId,
        promoId: promo.id,
        orderId: null, // null indicates claimed but not used
      },
    });

    return res.status(201).json({ success: true, message: 'Voucher berhasil diklaim!' });
  } catch (error: any) {
    console.error('Claim Promo Error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// GET /api/promos/mine
// Mengambil daftar promo yang sudah diklaim oleh user (unused)
router.get('/promos/mine', requireUser, async (req: any, res: any) => {
  try {


    // Find unused claims
    const claims = await getPrisma().userPromo.findMany({
      where: {
        userId,
        orderId: null,
      },
      include: {
        promo: true, // Fetch promo details
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter out expired promos from the results (they might have claimed it before it expired)
    const now = new Date();
    const activeClaims = claims.filter((c) => {
      const p = c.promo;
      if (!p.active) return false;
      if (p.endDate && new Date(p.endDate) < now) return false;
      return true;
    });

    res.json({ success: true, claims: activeClaims });
  } catch (error: any) {
    console.error('Mine Promo Error:', error);
    res.status(500).json({ success: false, claims: [] });
  }
});

export default router;







