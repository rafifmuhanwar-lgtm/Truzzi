import { Router, type Request, type Response, type NextFunction } from 'express';
import { config } from '../config.js';
import { getUser, requireUser, readSessionToken, verifySession } from '../services/session.js';
import * as db from '../services/data.js';

function getCookieName(app?: string): string {
  if (app === 'driver') return config.session.cookieNameDriver;
  if (app === 'customer') return config.session.cookieNameCustomer;
  return config.session.cookieName;
}

function detectApp(req: Request): string | undefined {
  const appHeader = req.headers['x-app'];
  if (appHeader === 'driver') return 'driver';
  if (appHeader === 'customer') return 'customer';
  const origin = req.headers.origin ?? '';
  if (origin.includes(':5174') || origin.includes('driver')) return 'driver';
  if (origin.includes(':5173') || origin.includes('customer')) return 'customer';
  return undefined;
}

const router = Router();

// Middleware to attach user from app-specific cookie
router.use((req: Request, _res: Response, next: NextFunction) => {
  const app = detectApp(req);
  const cookieName = getCookieName(app);
  const token = readSessionToken(req, cookieName);
  const user = token ? verifySession(token) : null;
  if (user) {
    (req as Request & { user?: typeof user }).user = user;
  }
  next();
});

/** Hitung biaya layanan platform — persentase 2.1%, minimal Rp 500. */
function hitungFee(budget: number): number {
  if (budget <= 0) return 0;
  const fee = budget * 0.021;
  return Math.max(500, Math.round(fee));
}

/** Ambil wallet & pastikan ada. */
async function walletOf(userId: string): Promise<Record<string, any>> {
  return db.ensureWallet(userId);
}

// GET /api/gigs — daftar gig publik (bisa filter category/status)
router.get('/', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  const category = (req.query.category as string) || 'all';
  const status = (req.query.status as string) || 'open';
  const gigs = await db.listGigs({
    category,
    status,
    excludePosterId: user.id,
    limit: 100,
  });
  res.json({ gigs });
});

// GET /api/gigs/mine?role=posted|worked — daftar gig milik user
router.get('/mine', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  const role = (req.query.role as string) || 'posted';
  const kind = role === 'worked' ? 'workerId' : 'posterId';
  const gigs = await db.listGigs({ [kind]: user.id, status: 'all', limit: 200 });
  res.json({ gigs });
});

// POST /api/gigs — pasang gig baru (budget + fee; dana ditahan escrow & debit wallet)
router.post('/', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const body = req.body ?? {};
    const title = String(body.title ?? '').trim();
    const description = String(body.description ?? '').trim();
    if (!title || !description) {
      return res.status(400).json({ message: 'Judul dan deskripsi wajib diisi' });
    }
    const budget = Math.max(0, Number(body.budget ?? 0) || 0);
    if (budget <= 0) {
      return res.status(400).json({ message: 'Nominal budget harus lebih dari nol' });
    }
    const category = body.category === 'fisik' ? 'fisik' : 'digital';
    const location = body.location ? String(body.location).trim() : null;
    if (category === 'fisik' && !location) {
      return res.status(400).json({ message: 'Tugas fisik wajib mencantumkan lokasi' });
    }
    const deadline = body.deadline ? new Date(String(body.deadline)) : null;
    const biayaLayanan = hitungFee(budget);
    const total = budget + biayaLayanan;

    // Pastikan saldo cukup sebelum membuat gig
    const wallet = await walletOf(user.id);
    const balance = Number(wallet.balance ?? 0) || 0;
    if (balance < total) {
      return res.status(402).json({
        code: 'INSUFFICIENT_BALANCE',
        message: `Saldo TruzziPay tidak cukup. Saldo: Rp ${Math.round(balance)}, Dibutuhkan: Rp ${Math.round(total)}`,
        needed: total,
        balance,
      });
    }

    const gig = await db.createGig({
      posterId: user.id,
      title,
      description,
      category,
      location,
      budget,
      biayaLayanan,
      deadline: deadline ? deadline.toISOString() : null,
      status: 'open',
      escrowId: null,
      createdAt: new Date().toISOString(),
    });

    // Escrow held DULU + gig di-tandai escrow — hanya setelah sukses wallet didebit,
    // agar kalau escrow gagal tidak ada saldo yang kepotong.
    const nowIso2 = new Date().toISOString();
    const escrowId = `es_gig_${gig.$id ?? gig.id}`;
    await db.createEscrow({
      $id: escrowId,
      gigId: gig.$id ?? gig.id,
      userId: user.id,
      amount: total,
      status: 'held',
      serviceType: 'gig',
      createdAt: nowIso2,
      danaBelanja: budget,
      ongkir: 0,
      biayaLayanan,
    });
    await db.updateGig(gig.$id ?? gig.id, { escrowId });
    await db.updateWallet(user.id, {
      balance: Number(wallet.balance ?? 0) - total,
      totalSpent: Number(wallet.totalSpent ?? 0) + total,
      updatedAt: nowIso2,
    });

    await db.createNotification({
      userId: user.id,
      category: 'Cari Cuan',
      title: 'Tugas Berhasil Dipasang 🎉',
      body: `Tugas "${title}" kini terbuka bagi pengerja. Dana Rp ${total.toLocaleString('id-ID')} diamankan escrow.`,
      routeName: '/gigs',
    });

    res.status(201).json({ gig: await db.getGig(gig.$id ?? gig.id) });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal memasang tugas' });
  }
});

// GET /api/gigs/:id
router.get('/:id', requireUser, async (req: Request, res: Response) => {
  const gig = await db.getGig(req.params.id);
  if (!gig) return res.status(404).json({ message: 'Tugas tidak ditemukan' });
  const reviews = await db.listGigReviews(gig.id ?? gig.$id);
  res.json({ gig, reviews });
});

// POST /api/gigs/:id/take — worker mengambil (open → in_progress)
router.post('/:id/take', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const gig = await db.getGig(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    if (gig.posterId === user.id) return res.status(400).json({ message: 'Tidak bisa mengambil tugas milik sendiri' });
    if (gig.status !== 'open') return res.status(400).json({ message: 'Tugas sudah diambil orang lain' });

    const updated = await db.updateGig(gig.id ?? gig.$id, { workerId: user.id, status: 'in_progress' });
    await db.createNotification({
      userId: gig.posterId,
      category: 'Cari Cuan',
      title: 'Tugasmu Diambil! 🚀',
      body: `"${gig.title}" telah diambil oleh ${user.name}.`,
      routeName: '/gigs',
    });
    res.json({ gig: updated });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal mengambil tugas' });
  }
});

// POST /api/gigs/:id/submit — worker kirim bukti (in_progress → submitted)
router.post('/:id/submit', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const gig = await db.getGig(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    if (gig.workerId !== user.id) return res.status(403).json({ message: 'Bukan pengerja tugas ini' });
    if (gig.status !== 'in_progress') return res.status(400).json({ message: 'Tugas tidak dalam status pengerjaan' });

    const body = req.body ?? {};
    const proofImageUrl = body.proofImageUrl ? String(body.proofImageUrl) : null;
    const proofNote = body.proofNote ? String(body.proofNote) : null;
    const updated = await db.updateGig(gig.id ?? gig.$id, {
      status: 'submitted',
      proofImageUrl,
      proofNote,
    });
    await db.createNotification({
      userId: gig.posterId,
      category: 'Cari Cuan',
      title: 'Ada Bukti Baru 📸',
      body: `"${gig.title}" sudah dikirim hasil oleh pengerja. Silakan ditinjau.`,
      routeName: '/gigs',
    });
    res.json({ gig: updated });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal mengirim bukti' });
  }
});

// POST /api/gigs/:id/approve — penyedia setujui (submitted → completed; escrow release & bayar worker)
router.post('/:id/approve', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const gig = await db.getGig(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    if (gig.posterId !== user.id) return res.status(403).json({ message: 'Bukan pemasang tugas ini' });
    if (gig.status !== 'submitted') return res.status(400).json({ message: 'Tugas harus menunggu bukti & berstatus submitted' });

    const gigId = gig.id ?? gig.$id;
    const escrow = gig.escrowId ? await db.getEscrowById(gig.escrowId) : null;
    const budget = Number(gig.budget ?? 0) || 0;
    const biayaLayanan = Number(gig.biayaLayanan ?? 0) || 0;

    const updated = await db.updateGig(gigId, { status: 'completed' });

    // Release escrow & bayar worker = budget − (fee dibayar penyedia) ... worker menerima budget penuh?
    // Di desain: penyedia bayar (budget + fee); worker menerima budget penuh; fee platform = biayaLayanan.
    if (escrow && escrow.status === 'held') {
      await db.updateEscrow(escrow.$id ?? escrow.id, { status: 'released', releasedAt: new Date().toISOString() });
    }
    if (budget > 0) {
      const workerWallet = await walletOf(gig.workerId);
      await db.updateWallet(gig.workerId, {
        balance: Number(workerWallet.balance ?? 0) + budget,
        totalSpent: Number(workerWallet.totalSpent ?? 0),
        updatedAt: new Date().toISOString(),
      });
    }

    await db.createNotification({
      userId: gig.workerId,
      category: 'Cari Cuan',
      title: 'Tugasmu Disetujui 🎉',
      body: `"${gig.title}" disetujui. Rp ${budget.toLocaleString('id-ID')} masuk ke saldo TruzziPay-mu.`,
      routeName: '/gigs',
    });
    res.json({ gig: updated });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal menyetujui tugas' });
  }
});

// POST /api/gigs/:id/cancel — batal (dana kembali penuh ke penyedia)
router.post('/:id/cancel', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const gig = await db.getGig(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    // Hanya penyedia yang bisa batal
    if (gig.posterId !== user.id) return res.status(403).json({ message: 'Bukan pemasang tugas ini' });

    if (gig.status !== 'open' && gig.status !== 'in_progress') {
      return res.status(400).json({ message: 'Tugas dalam status ini tidak dapat dibatalkan' });
    }

    const gigId = gig.id ?? gig.$id;
    const budget = Number(gig.budget ?? 0) || 0;
    const biayaLayanan = Number(gig.biayaLayanan ?? 0) || 0;
    const total = budget + biayaLayanan;

    const updated = await db.updateGig(gigId, { status: 'cancelled' });

    // Refund escrow (jika held) + kembalikan ke wallet penyedia
    if (gig.escrowId) {
      const escrow = await db.getEscrowById(gig.escrowId);
      if (escrow && escrow.status === 'held') {
        await db.updateEscrow(escrow.$id ?? escrow.id, { status: 'refunded' });
      }
    }
    if (total > 0) {
      const w = await walletOf(user.id);
      await db.updateWallet(user.id, {
        balance: Number(w.balance ?? 0) + total,
        updatedAt: new Date().toISOString(),
      });
    }

    await db.createNotification({
      userId: user.id,
      category: 'Cari Cuan',
      title: 'Tugas Dibatalkan',
      body: 'Dana yang diamankan telah dikembalikan ke saldo TruzziPay-mu.',
      routeName: '/gigs',
    });
    res.json({ gig: updated });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal membatalkan tugas' });
  }
});

// POST /api/gigs/:id/review — rating 1–5
router.post('/:id/review', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const gig = await db.getGig(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    if (gig.status !== 'completed') return res.status(400).json({ message: 'Tugas belum selesai' });

    const body = req.body ?? {};
    const rating = Math.max(1, Math.min(5, Number(body.rating ?? 5) || 5));
    const comment = body.comment ? String(body.comment) : null;
    const review = await db.createGigReview({
      gigId: gig.id ?? gig.$id,
      reviewerId: user.id,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ review });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal memberikan penilaian' });
  }
});

export default router;