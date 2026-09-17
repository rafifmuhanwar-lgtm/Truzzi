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

const PRESET_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

// GET /api/wallet/:userId
router.get('/:userId', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  if (req.params.userId !== user.id) return res.status(403).json({ message: 'Bukan akun Anda' });
  const wallet = await db.ensureWallet(user.id);
  res.json({
    wallet: {
      id: user.id,
      userId: user.id,
      balance: Number(wallet.balance ?? 0) || 0,
      totalTopUp: Number(wallet.totalTopUp ?? 0) || 0,
      totalSpent: Number(wallet.totalSpent ?? 0) || 0,
      createdAt: wallet.createdAt ?? new Date().toISOString(),
      updatedAt: wallet.updatedAt ?? new Date().toISOString(),
    },
  });
});

// GET /api/wallet/:userId/escrows
router.get('/:userId/escrows', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  if (req.params.userId !== user.id) return res.status(403).json({ message: 'Bukan akun Anda' });
  const escrows = await db.listUserEscrows(user.id);
  res.json({ escrows });
});

// GET /api/wallet/:userId/topups
router.get('/:userId/topups', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  if (req.params.userId !== user.id) return res.status(403).json({ message: 'Bukan akun Anda' });
  const topups = await db.listUserTopUps(user.id);
  res.json({ topups });
});

// GET /api/wallet/:userId/withdrawals
router.get('/:userId/withdrawals', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  if (req.params.userId !== user.id) return res.status(403).json({ message: 'Bukan akun Anda' });
  const withdrawals = await db.listWithdrawalsByUser(user.id);
  res.json({ withdrawals });
});

// POST /api/wallet/withdraw { amount, method, accountNumber, accountName }
router.post('/withdraw', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const body = req.body ?? {};
    const amount = Math.round(Number(body.amount ?? 0)) || 0;
    const method = String(body.method ?? 'gopay').toLowerCase();
    const accountNumber = String(body.accountNumber ?? '').trim();
    const accountName = String(body.accountName ?? '').trim();

    if (amount < 10000) {
      return res.status(400).json({ message: 'Minimal penarikan saldo adalah Rp 10.000' });
    }
    if (!accountNumber) {
      return res.status(400).json({ message: 'Nomor e-wallet / rekening penarikan wajib diisi' });
    }

    const isBank = body.type === 'bank' || ['bca', 'mandiri', 'bri', 'bni', 'bsi', 'cimb', 'permata', 'danamon', 'jago', 'seabank', 'blu', 'bank'].some((b) => method.toLowerCase().includes(b));
    // Khusus Transfer Bank = GRATIS admin (Rp 0). E-Wallet = Rp 2.500 admin dipotong dari nominal penarikan.
    const adminFee = isBank ? 0 : 2500;
    const netAmount = Math.max(0, amount - adminFee);

    const wallet = await db.ensureWallet(user.id);
    const currentBalance = Number(wallet.balance ?? 0) || 0;

    if (currentBalance < amount) {
      return res.status(400).json({
        message: `Saldo tidak mencukupi. Penarikan Rp ${amount.toLocaleString('id-ID')}, Saldo Anda: Rp ${currentBalance.toLocaleString('id-ID')}`,
      });
    }

    const newBalance = currentBalance - amount;
    await db.updateWallet(user.id, {
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    });

    const nowIso = new Date().toISOString();
    
    // Simpan ke riwayat transaksi penarikan
    try {
      await db.createWithdrawal({
        userId: user.id,
        amount,
        bankName: method,
        accountNumber,
        status: 'pending',
      });
    } catch {
      // Ignore if fallback
    }

    await db.createNotification({
      userId: user.id,
      category: 'Sistem & Akun',
      title: 'Penarikan Saldo Diproses 💸',
      body: `Penarikan Rp ${amount.toLocaleString('id-ID')} ke ${method.toUpperCase()} (${accountNumber}) diproses. Dana diterima: Rp ${netAmount.toLocaleString('id-ID')} (Admin: Rp ${adminFee.toLocaleString('id-ID')}). ESTIMASI 1x24 JAM.`,
      routeName: '/profile/payment',
    });

    res.json({
      success: true,
      message: 'Penarikan saldo berhasil diproses! Estimasi pencairan 1x24 jam atau lebih cepat.',
      withdrawal: {
        amount,
        adminFee,
        netAmount,
        method,
        accountNumber,
        accountName,
        status: 'pending',
        createdAt: nowIso,
      },
      newBalance,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal memproses penarikan saldo' });
  }
});

export { PRESET_AMOUNTS };
export default router;