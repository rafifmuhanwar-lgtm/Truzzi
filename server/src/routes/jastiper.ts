/**
 * Route kurir — dipakai web app kedua (driver/).
 * Semua endpoint wajib login dengan role 'jastiper' (kecuali register).
 * Label status & rumus pendapatan disalin persis dari Flutter jastiper_app.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { getUser, requireJastiper, signSession, setSessionCookie, readSessionToken, verifySession } from '../services/session.js';
import * as db from '../services/data.js';
import { hitungSettlement } from '../services/escrow.js';
import { getPrisma } from '../services/prisma-client.js';

type Doc = Record<string, any>;

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

// Middleware to attach user from app-specific cookie (for jastiper/driver app)
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

// Opsi dropdown persis Flutter (onboarding vs edit profile berbeda).
export const VEHICLE_TYPES_ONBOARDING = ['Motor', 'Mobil'];
export const VEHICLE_TYPES_PROFILE = ['Motor', 'Mobil', 'Sepeda'];
export const AREAS_ONBOARDING = ['Kota Bekasi', 'Kabupaten Bekasi'];
export const AREAS_PROFILE = [
  'Jakarta Pusat', 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Selatan', 'Jakarta Timur',
  'Tangerang', 'Kota Bekasi', 'Kabupaten Bekasi', 'Depok', 'Bogor',
];

/** Tahapan status persis `_statusOptions` di order_detail_screen.dart. */
const STATUS_STAGES = [
  'Menuju Lokasi',
  'Sampai di Lokasi',
  'Barang Dibeli',           // Jastip: setelah upload struk
  'Barang Dibeli / Tugas Selesai', // Suruh: langsung selesai tanpa struk
  'Dalam Perjalanan ke Tujuan',
  'Pesanan Selesai',
];

/** Pastikan User ber-role jastiper + baris Jastiper ada (id = user.id, pola Appwrite asli). */
async function ensureJastiperProfile(userId: string): Promise<Doc> {
  const user = await db.getUserDoc(userId);
  if (!user) throw new Error('User tidak ditemukan');
  if (user.role !== 'jastiper') {
    await db.updateUserDoc(userId, { role: 'jastiper' });
  }
  return db.upsertJastiper(userId, {
    id: userId,
    name: user.name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    photoUrl: user.photoUrl ?? '',
  });
}

/** Profil kurir gabungan (User + Jastiper) untuk response /me. */
async function jastiperMe(userId: string): Promise<Doc | null> {
  const user = await db.getUserDoc(userId);
  const jastiper = await db.getJastiper(userId);
  if (!user && !jastiper) return null;
  return {
    id: userId,
    name: jastiper?.name ?? user?.name ?? '',
    email: jastiper?.email ?? user?.email ?? '',
    phone: jastiper?.phone ?? user?.phone ?? null,
    photoUrl: jastiper?.photoUrl ?? user?.photoUrl ?? null,
    vehicleType: jastiper?.vehicleType ?? null,
    vehiclePlate: jastiper?.vehiclePlate ?? null,
    selectedArea: jastiper?.selectedArea ?? user?.selectedArea ?? null,
    isOnline: Boolean(jastiper?.isOnline ?? false),
    isActive: jastiper?.isActive ?? true,
    kycVerified: Boolean(jastiper?.kycVerified ?? false),
    kycKtpUrl: jastiper?.kycKtpUrl ?? null,
    role: 'jastiper',
  };
}

// ── Auth ──

// POST /api/jastiper/register {name,email,password,phone} — daftar akun kurir
router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const phone = String(body.phone ?? '').trim();

    // Validasi persis register_screen.dart
    if (name.length < 3) return res.status(400).json({ message: 'Nama minimal 3 karakter' });
    if (!email.includes('@') || !email.includes('.')) return res.status(400).json({ message: 'Format email tidak valid' });
    if (phone.length < 10 || !phone.startsWith('08')) return res.status(400).json({ message: 'Nomor telepon tidak valid (08xxxxxxxxxx)' });
    if (password.length < 8) return res.status(400).json({ message: 'Password minimal 8 karakter' });

    if (config.data.engine === 'postgres') {
      const exists = await getPrisma().user.findUnique({ where: { email } });
      if (exists) return res.status(409).json({ message: 'Email sudah terdaftar' });
      const hash = await bcrypt.hash(password, 10);
      const created = await getPrisma().user.create({
        data: {
          id: `usr_${Date.now().toString(36)}${Math.random().toString(16).slice(2, 8)}`,
          name,
          email,
          passwordHash: hash,
          phone,
          role: 'jastiper',
        },
      });
      await db.upsertJastiper(created.id, { id: created.id, name, email, phone });
      const sessionUser = { id: created.id, name, email, phone, role: 'jastiper' as const };
      setSessionCookie(res, signSession(sessionUser));
      return res.status(201).json({ user: sessionUser });
    }
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal mendaftar' });
  }
});

// GET /api/jastiper/me — profil kurir lengkap
router.get('/me', requireJastiper, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  await ensureJastiperProfile(user.id);
  const me = await jastiperMe(user.id);
  res.json({ user: me });
});

// PUT /api/jastiper/profile — kendaraan, area, foto, nama, telepon
router.put('/profile', requireJastiper, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    await ensureJastiperProfile(user.id);
    const body = req.body ?? {};
    const patch: Doc = {};
    if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
    if (typeof body.phone === 'string') patch.phone = body.phone;
    if (typeof body.photoUrl === 'string') patch.photoUrl = body.photoUrl;
    if (typeof body.vehicleType === 'string') patch.vehicleType = body.vehicleType;
    if (typeof body.vehiclePlate === 'string') patch.vehiclePlate = body.vehiclePlate.toUpperCase();
    if (typeof body.selectedArea === 'string') patch.selectedArea = body.selectedArea;

    await db.updateJastiper(user.id, patch);
    // Sinkronkan nama/telepon/foto/area ke User juga (dipakai chat & session).
    const userPatch: Doc = {};
    if (patch.name) userPatch.name = patch.name;
    if (patch.phone !== undefined) userPatch.phone = patch.phone;
    if (patch.photoUrl !== undefined) userPatch.photoUrl = patch.photoUrl;
    if (patch.selectedArea !== undefined) userPatch.selectedArea = patch.selectedArea;
    if (Object.keys(userPatch).length) await db.updateUserDoc(user.id, userPatch);

    const me = await jastiperMe(user.id);
    res.json({ user: me });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal memperbarui profil' });
  }
});

// POST /api/jastiper/kyc {ktpUrl, selfieUrl} — simpan dokumen KYC (menunggu review admin)
router.post('/kyc', requireJastiper, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    await ensureJastiperProfile(user.id);
    const { ktpUrl, selfieUrl } = req.body ?? {};
    if (!ktpUrl || !selfieUrl) {
      return res.status(400).json({ message: 'Harap foto KTP dan Selfie terlebih dahulu' });
    }
    await db.updateJastiper(user.id, { kycKtpUrl: ktpUrl, kycSelfieUrl: selfieUrl, kycVerified: false });
    const me = await jastiperMe(user.id);
    res.json({ user: me });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal menyimpan verifikasi' });
  }
});

// POST /api/jastiper/online {isOnline} — toggle status online/offline
router.post('/online', requireJastiper, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    await ensureJastiperProfile(user.id);
    const isOnline = Boolean(req.body?.isOnline);
    await db.updateJastiper(user.id, { isOnline });
    res.json({ isOnline });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal mengubah status online' });
  }
});

// ── Orders ──

// GET /api/jastiper/orders/available — order ongoing tanpa kurir
router.get('/orders/available', requireJastiper, async (_req: Request, res: Response) => {
  const orders = await db.listAvailableOrders();
  res.json({ orders });
});

// GET /api/jastiper/orders/mine — semua order milik kurir ini
router.get('/orders/mine', requireJastiper, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  const orders = await db.listJastiperOrders(user.id);
  res.json({ orders });
});

// POST /api/jastiper/orders/:id/accept — terima order (atomik, anti-race)
router.post('/orders/:id/accept', requireJastiper, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const jastiper = await db.getJastiper(user.id);
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    if (order.status !== 'ongoing') return res.status(400).json({ message: 'Pesanan tidak lagi tersedia' });

    const updated = await db.acceptOrder(req.params.id, {
      jastiperId: user.id,
      jastiperName: jastiper?.name ?? user.name,
      jastiperPhone: jastiper?.phone ?? '',
      jastiperAvatar: jastiper?.photoUrl ?? '',
      statusText: 'Menuju Lokasi',
    });
    if (!updated) return res.status(409).json({ message: 'Pesanan sudah diambil kurir lain' });

    // Notif ke customer — template persis PushNotificationSender.sendOrderUpdate
    await db.createNotification({
      userId: order.userId,
      category: 'Pesanan',
      title: 'Kurir Sedang Menuju 📍',
      body: `${jastiper?.name ?? user.name} sedang menuju lokasi jemput untuk pesanan "${order.title}".`,
      routeName: '/tracking',
      routeExtra: order.$id ?? order.id,
    });
    res.json({ order: updated });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal menerima pesanan' });
  }
});

// PATCH /api/jastiper/orders/:id/status {statusText} — maju tahap (hanya kurir pemilik)
router.patch('/orders/:id/status', requireJastiper, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    if (order.jastiperId !== user.id) return res.status(403).json({ message: 'Bukan pesanan Anda' });
    if (order.status !== 'ongoing') return res.status(400).json({ message: 'Pesanan sudah selesai/dibatalkan' });

    const statusText = String(req.body?.statusText ?? '');
    if (!STATUS_STAGES.includes(statusText)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }
    const patchData: Record<string, any> = { statusText };
    if (req.body?.strukImageUrl) {
      patchData.strukImageUrl = req.body.strukImageUrl;
    }
    const updated = await db.updateOrder(req.params.id, patchData);
    res.json({ order: updated });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal memperbarui status' });
  }
});

// POST /api/jastiper/orders/:id/location {lat,lng} — live location kurir
router.post('/orders/:id/location', requireJastiper, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    if (order.jastiperId !== user.id) return res.status(403).json({ message: 'Bukan pesanan Anda' });

    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'Koordinat tidak valid' });
    }
    await db.updateOrder(req.params.id, { jastiperLat: lat, jastiperLng: lng });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal memperbarui lokasi' });
  }
});

// POST /api/jastiper/orders/:id/receipt {strukImageUrl,totalBelanjaStruk} — upload struk + settlement
router.post('/orders/:id/receipt', requireJastiper, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    if (order.jastiperId !== user.id) return res.status(403).json({ message: 'Bukan pesanan Anda' });
    if (order.status !== 'ongoing') return res.status(400).json({ message: 'Pesanan sudah selesai/dibatalkan' });

    const strukImageUrl = req.body?.strukImageUrl;
    const totalStruk = Number(req.body?.totalBelanjaStruk);
    if (!strukImageUrl) return res.status(400).json({ message: 'Harap foto struk belanja terlebih dahulu' });
    if (!Number.isFinite(totalStruk) || totalStruk <= 0) return res.status(400).json({ message: 'Masukkan nominal yang valid' });

    const danaBelanja = Number(order.danaBelanja ?? 0) || 0;
    const ongkir = Number(order.ongkir ?? 0) || 0;
    const biayaLayanan = Number(order.biayaLayanan ?? 0) || 0;
    const kebijakan = (order.kebijakanLebih ?? 'jangan_lebih') as 'jangan_lebih' | 'boleh_lebih';

    const settlement = hitungSettlement({ danaBelanja, totalBelanjaStruk: totalStruk, ongkir, biayaLayanan, kebijakanLebih: kebijakan });
    if (settlement.invalid) {
      return res.status(400).json({
        code: 'OVER_BUDGET_INVALID',
        message: 'Total belanja melebihi dana dan kebijakan "jangan lebih" — pesanan tidak dapat diselesaikan dengan struk ini.',
      });
    }

    const updated = await db.updateOrder(req.params.id, {
      statusText: 'Barang Dibeli',
      strukImageUrl,
      totalBelanjaStruk: totalStruk,
      refundCustomer: settlement.refundCustomer,
      pendingApproval: settlement.isOverBudget,
      requestedTopup: settlement.isOverBudget ? totalStruk - danaBelanja : null,
    });
    res.json({ order: updated, settlement });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal mengupload struk' });
  }
});

// POST /api/jastiper/orders/:id/complete {deliveryProofUrl} — set waiting_confirmation
router.post('/orders/:id/complete', requireJastiper, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    if (order.jastiperId !== user.id) return res.status(403).json({ message: 'Bukan pesanan Anda' });
    if (order.status !== 'ongoing') return res.status(400).json({ message: 'Pesanan sudah selesai/dibatalkan' });

    const deliveryProofUrl = req.body?.deliveryProofUrl;
    if (!deliveryProofUrl) return res.status(400).json({ message: 'Harap ambil foto bukti barang diterima terlebih dahulu' });

    const needsAdminReview = (order.totalAmount ?? 0) >= 1000000;

    const updated = await db.updateOrder(req.params.id, {
      status: 'waiting_confirmation',
      statusText: 'Menunggu Konfirmasi Customer',
      deliveryProofUrl,
      completedAt: new Date().toISOString(),
      needsAdminReview,
    });

    // Notif ke customer — minta konfirmasi
    await db.createNotification({
      userId: order.userId,
      category: 'Pesanan',
      title: 'Konfirmasi Penerimaan Barang 📦',
      body: `Jastiper telah menyelesaikan pesanan "${order.title}". Silakan konfirmasi penerimaan barang dan berikan ulasan.`,
      routeName: '/order/confirm',
      routeExtra: order.$id ?? order.id,
    });

    if (needsAdminReview) {
      // Notify admins
      const admins = await getPrisma().user.findMany({ where: { role: 'admin' } });
      for (const admin of admins) {
        await db.createNotification({
          userId: admin.id,
          category: 'Admin',
          title: 'Review Pesanan Nominal Tinggi 🔍',
          body: `Pesanan "${order.title}" senilai Rp${(order.totalAmount ?? 0).toLocaleString('id-ID')} memerlukan review admin.`,
          routeName: '/admin',
          routeExtra: '',
        });
      }
    }

    // Auto-confirm setelah 6 jam
    setTimeout(async () => {
      try {
        const latestOrder = await db.getOrder(req.params.id);
        if (latestOrder && latestOrder.status === 'waiting_confirmation' && !latestOrder.customerConfirmed) {
          await finalizeOrder(req.params.id, latestOrder);
        }
      } catch (e) {
        console.error('Auto-confirm error:', e);
      }
    }, 6 * 60 * 60 * 1000); // 6 jam

    res.json({ order: updated });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal menyelesaikan pesanan' });
  }
});

// ── Shared: Finalize order (release escrow, refund, notify) ──

async function finalizeOrder(orderId: string, order: any) {
  const updated = await db.updateOrder(orderId, {
    status: 'completed',
    statusText: 'Pesanan Selesai',
    customerConfirmed: true,
  });

  // Release escrow + refund sisa dana belanja ke wallet customer.
  const escrowId = order.escrowId || `es_order_${order.$id ?? order.id}`;
  const escrow = await db.getEscrowById(escrowId);
  if (escrow && escrow.status === 'held') {
    await db.updateEscrow(escrowId, { status: 'released', releasedAt: new Date().toISOString() });
    const refund = Number(updated.refundCustomer ?? 0);
    if (refund > 0) {
      const wallet = await db.ensureWallet(order.userId);
      await db.updateWallet(order.userId, {
        balance: (Number(wallet.balance ?? 0) || 0) + refund,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Notif ke customer
  await db.createNotification({
    userId: order.userId,
    category: 'Pesanan',
    title: 'Pesanan Selesai ✅',
    body: `Pesanan "${order.title}" telah selesai. Terima kasih telah menggunakan Truzzi!`,
    routeName: '/order/detail',
    routeExtra: order.$id ?? order.id,
  });

  // Notif ke jastiper
  if (order.jastiperId) {
    await db.createNotification({
      userId: order.jastiperId,
      category: 'Pesanan',
      title: 'Pesanan Dikonfirmasi ✅',
      body: `Customer telah mengkonfirmasi penerimaan pesanan "${order.title}". Dana akan masuk ke saldo Anda.`,
      routeName: '/order/detail',
      routeExtra: order.$id ?? order.id,
    });
  }

  return updated;
}

// ── Customer Confirm Order ──

// POST /api/jastiper/orders/:id/confirm-received { rating, reviewText }
router.post('/orders/:id/confirm-received', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Login diperlukan' });
    const userId = user.id;

    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    console.log('[DEBUG] confirm-received: order.userId =', order.userId, 'session.userId =', userId);
    if (order.userId !== userId) return res.status(403).json({ message: 'Bukan pesanan Anda' });
    if (order.status !== 'waiting_confirmation') return res.status(400).json({ message: 'Pesanan tidak dalam status menunggu konfirmasi' });

    const { rating, reviewText } = req.body || {};
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating harus 1-5' });

    // Save review
    await db.updateOrder(req.params.id, {
      reviewRating: Number(rating),
      reviewText: reviewText || '',
    });

    // Finalize
    const updated = await finalizeOrder(req.params.id, order);

    res.json({ order: updated });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal mengkonfirmasi pesanan' });
  }
});

// ── Earnings & Withdrawal ──

/**
 * Pendapatan kurir — rumus persis jastiper_earnings_provider.dart:
 * earn per order selesai = ongkir (+ totalBelanjaStruk utk jastip);
 * bucket hari/bulan dari createdAt; saldo dikurangi withdrawal pending|approved.
 */
async function hitungPendapatan(jastiperId: string) {
  const orders = await db.listJastiperOrders(jastiperId);
  const done = orders.filter((o) => o.statusText === 'Pesanan Selesai' || o.status === 'completed');
  const now = new Date();
  let hariIni = 0;
  let bulanIni = 0;
  let total = 0;
  for (const o of done) {
    let earn = Number(o.ongkir ?? 0) || 0;
    const type = o.orderType ?? o.type;
    if (type === 'jastip') {
      const belanja = o.totalBelanjaStruk != null ? Number(o.totalBelanjaStruk) : Number(o.danaBelanja ?? 0);
      earn += belanja || 0;
    }
    total += earn;
    const created = new Date(o.createdAt);
    if (created.toDateString() === now.toDateString()) hariIni += earn;
    if (created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()) bulanIni += earn;
  }
  const withdrawals = await db.listWithdrawalsByUser(jastiperId);
  const withdrawn = withdrawals
    .filter((w) => w.status === 'pending' || w.status === 'approved')
    .reduce((s, w) => s + (Number(w.amount ?? 0) || 0), 0);
  return { hariIni, bulanIni, total, saldo: total - withdrawn };
}

// GET /api/jastiper/earnings
router.get('/earnings', requireJastiper, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  const earnings = await hitungPendapatan(user.id);
  res.json(earnings);
});

// GET /api/jastiper/withdrawals — riwayat penarikan
router.get('/withdrawals', requireJastiper, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  const withdrawals = await db.listWithdrawalsByUser(user.id);
  res.json({ withdrawals });
});

// POST /api/jastiper/withdrawals {amount,bankName,accountNumber} — min Rp 10.000
router.post('/withdrawals', requireJastiper, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const amount = Number(req.body?.amount);
    const bankName = String(req.body?.bankName ?? '').trim();
    const accountNumber = String(req.body?.accountNumber ?? '').trim();

    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'Nominal tidak valid' });
    if (amount < 10000) return res.status(400).json({ message: 'Minimal penarikan adalah Rp 10.000' });
    if (!bankName) return res.status(400).json({ message: 'Pilih bank / e-wallet tujuan' });
    if (!accountNumber) return res.status(400).json({ message: 'Masukkan nomor rekening' });

    const { saldo } = await hitungPendapatan(user.id);
    if (amount > saldo) return res.status(400).json({ message: 'Saldo tidak mencukupi' });

    const withdrawal = await db.createWithdrawal({
      userId: user.id,
      amount,
      bankName,
      accountNumber,
      status: 'pending',
    });
    res.status(201).json({ withdrawal });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal membuat permintaan penarikan' });
  }
});

export default router;

