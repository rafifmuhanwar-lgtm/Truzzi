import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as db from '../services/data.js';
import { getPrisma } from '../services/prisma-client.js';
import { adminAuth } from '../middlewares/adminAuth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'truzzix_admin_secret_key_2026';

// POST /api/admin/login — Login admin
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await getPrisma().user.findUnique({ where: { email } });
    if (!admin || admin.role !== 'admin' || !admin.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protect all routes below this line
router.use(adminAuth);

// GET /api/admin/stats — Ringkasan statistik platform
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    // 1. Ambil data pesanan
    const orders = (await (db as any).listAllOrders?.()) ?? [];
    const gigs = (await (db as any).listAllGigs?.()) ?? [];
    const withdrawals = (await (db as any).listAllWithdrawals?.()) ?? [];
    const jastipers = (await (db as any).listAllJastipers?.()) ?? [];
    const users = (await (db as any).listAllUsers?.()) ?? [];

    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter((o: any) => o.status === 'completed');
    const ongoingOrders = orders.filter((o: any) =>
      ['ongoing', 'accepted', 'on_the_way'].includes(o.status),
    );

    // Hitung total nilai transaksi & estimasi admin fee
    let totalGMV = 0;
    let totalPlatformFee = 0;
    orders.forEach((o: any) => {
      totalGMV += Number(o.totalAmount ?? o.danaBelanja ?? 0);
      totalPlatformFee += Number(o.biayaLayanan ?? 0);
    });

    const totalEscrowLocked = orders
      .filter((o: any) => ['ongoing', 'accepted', 'on_the_way'].includes(o.status))
      .reduce((acc: number, o: any) => acc + Number(o.totalAmount ?? 0), 0);

    const pendingWithdrawalsCount = withdrawals.filter((w: any) => w.status === 'pending').length;

    res.json({
      stats: {
        totalGMV,
        totalPlatformFee,
        totalEscrowLocked,
        totalOrdersCount,
        completedOrdersCount: completedOrders.length,
        ongoingOrdersCount: ongoingOrders.length,
        totalGigsCount: gigs.length,
        totalJastipersCount: jastipers.length,
        activeJastipersCount: jastipers.filter((c: any) => c.isOnline).length,
        totalUsersCount: users.length,
        pendingWithdrawalsCount,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat statistik admin' });
  }
});

// GET /api/admin/withdrawals — Daftar semua penarikan saldo
router.get('/withdrawals', async (_req: Request, res: Response) => {
  try {
    const withdrawals = (await (db as any).listAllWithdrawals?.()) ?? [];
    res.json({ withdrawals });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat daftar penarikan saldo' });
  }
});

// POST /api/admin/withdrawals/:id/approve — Setujui penarikan saldo
router.post('/withdrawals/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await (db as any).updateWithdrawalStatus?.(id, 'approved');
    if (updated && updated.userId) {
      await db.createNotification({
        userId: updated.userId,
        category: 'Sistem & Akun',
        title: 'Penarikan Berhasil 🎉',
        body: `Penarikan saldo Anda sebesar Rp ${(updated.amount || 0).toLocaleString('id-ID')} telah berhasil ditransfer ke rekening Anda.`,
        routeName: '/profile/payment',
      });
    }
    res.json({
      success: true,
      message: 'Penarikan saldo disetujui & berhasil ditransfer!',
      withdrawal: updated,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal menyetujui penarikan saldo' });
  }
});

// POST /api/admin/withdrawals/:id/reject — Tolak penarikan saldo & kembalikan saldo user
router.post('/withdrawals/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await (db as any).updateWithdrawalStatus?.(id, 'rejected');
    if (updated && updated.userId) {
      await db.createNotification({
        userId: updated.userId,
        category: 'Sistem & Akun',
        title: 'Penarikan Ditolak ❌',
        body: `Penarikan saldo Anda sebesar Rp ${(updated.amount || 0).toLocaleString('id-ID')} ditolak oleh Admin. Saldo telah dikembalikan ke dompet Anda.`,
        routeName: '/profile/payment',
      });
    }
    res.json({
      success: true,
      message: 'Penarikan saldo ditolak dan saldo dikembalikan',
      withdrawal: updated,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal menolak penarikan saldo' });
  }
});

router.delete('/withdrawals/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await (db as any).deleteWithdrawal?.(id);
    res.json({ success: true, message: 'Penarikan saldo berhasil dihapus' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal menghapus penarikan saldo' });
  }
});

// GET /api/admin/promos — Ambil banner promo custom
router.get('/promos', async (_req: Request, res: Response) => {
  try {
    const promos = await db.listAllPromos();
    res.json({ promos });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat promo' });
  }
});

// POST /api/admin/promos — Upload / buat banner promo baru
router.post('/promos', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    if (!body.title) {
      return res.status(400).json({ message: 'Judul Banner wajib diisi' });
    }

    const newPromo = await db.createPromo({
      badge: String(body.badge || 'PROMO TRUZZI'),
      title: String(body.title),
      subtitle: String(body.subtitle || ''),
      code: String(body.code || 'TRUZZI'),
      period: String(body.period || 'Berlaku s.d. Selesai'),
      imageUrl: body.imageUrl ? String(body.imageUrl) : undefined,
      gradient: body.gradient || 'from-[#7F1D3A] via-[#5C1A3A] to-[#3B0E1E]',
      accent: body.accent || 'text-white',

      // Advanced fields
      type: body.type,
      category: body.category,
      minTransaction: body.minTransaction,
      discountPercent: body.discountPercent,
      discountFlat: body.discountFlat,
      maxDiscount: body.maxDiscount,
      startDate: body.startDate,
      endDate: body.endDate,
      quota: body.quota,
      budgetMax: body.budgetMax,
      targetUsers: body.targetUsers,
      isNewUserOnly: body.isNewUserOnly,
    });

    res
      .status(201)
      .json({ success: true, message: 'Banner promo berhasil ditambahkan!', promo: newPromo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal membuat banner promo' });
  }
});

// DELETE /api/admin/promos/:id — Hapus banner promo
router.delete('/promos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.deletePromo(id);
    res.json({ success: true, message: 'Banner promo berhasil dihapus' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal menghapus banner promo' });
  }
});

// ── Users CRUD ──
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await db.listAllUsers();
    res.json({ users });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat pengguna' });
  }
});

router.patch('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await db.updateUser(id, req.body ?? {});
    res.json({ success: true, message: 'Data pengguna diperbarui', user: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memperbarui pengguna' });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.deleteUser(id);
    res.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal menghapus pengguna' });
  }
});

// ── Jastipers & Jastipers CRUD ──
router.get('/jastipers', async (_req: Request, res: Response) => {
  try {
    const jastipers = await db.listAllJastipers();
    res.json({ jastipers });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat mitra kurir' });
  }
});

router.patch('/jastipers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await db.updateJastiper(id, req.body ?? {});
    res.json({ success: true, message: 'Data mitra berhasil diperbarui', jastiper: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memperbarui mitra' });
  }
});

router.delete('/jastipers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.deleteJastiper(id);
    res.json({ success: true, message: 'Mitra berhasil dihapus' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal menghapus mitra' });
  }
});

// ── Orders CRUD ──
router.get('/orders', async (_req: Request, res: Response) => {
  try {
    const orders = await db.listAllOrders();
    res.json({ orders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat pesanan' });
  }
});

router.patch('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await db.updateOrder(id, req.body ?? {});
    res.json({ success: true, message: 'Status pesanan diperbarui', order: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memperbarui pesanan' });
  }
});

router.delete('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.deleteOrder(id);
    res.json({ success: true, message: 'Pesanan berhasil dihapus' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal menghapus pesanan' });
  }
});

// ── Gigs CRUD ──
router.get('/gigs', async (_req: Request, res: Response) => {
  try {
    const gigs = await db.listAllGigs();
    res.json({ gigs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memuat tugas' });
  }
});

router.delete('/gigs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.deleteGig(id);
    res.json({ success: true, message: 'Tugas berhasil dihapus' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal menghapus tugas' });
  }
});

export default router;
