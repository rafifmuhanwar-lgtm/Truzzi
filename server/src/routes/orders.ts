import { Router, type Request, type Response, type NextFunction } from 'express';
import { config } from '../config.js';
import { getUser, requireUser, readSessionToken, verifySession } from '../services/session.js';
import * as db from '../services/data.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema } from '../schemas/order.schema.js';
import { hitungSettlement } from '../services/escrow.js';
import { createNotification } from '../services/data.js';
import { getPrisma } from '../services/prisma-client.js';

/** Hitung jarak+ongkir+total — dipakai create order bila frontend kirim coords. */
import { hitungOngkir, hitungBiayaLayanan, hitungTotal } from '../services/pricing.js';
import { hitungJarak } from '../services/distance.js';

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

async function computePricing(data: Record<string, unknown>) {
  const pickupLat = Number(data.pickupLat ?? data.pickup_lat ?? NaN);
  const pickupLng = Number(data.pickupLng ?? data.pickup_lng ?? NaN);
  const dropoffLat = Number(data.dropoffLat ?? data.dropoff_lat ?? NaN);
  const dropoffLng = Number(data.dropoffLng ?? data.dropoff_lng ?? NaN);

  let jarakKm = 3.0;
  let estimasiMenit = 30;
  if (
    Number.isFinite(pickupLat) &&
    Number.isFinite(pickupLng) &&
    Number.isFinite(dropoffLat) &&
    Number.isFinite(dropoffLng)
  ) {
    try {
      const dist = await hitungJarak({
        fromLat: pickupLat,
        fromLng: pickupLng,
        toLat: dropoffLat,
        toLng: dropoffLng,
      });
      jarakKm = dist.jarakKm;
      estimasiMenit = dist.estimasiMenit;
    } catch {
      /* default */
    }
  }
  const ongkir = hitungOngkir(jarakKm);
  const biayaLayanan = hitungBiayaLayanan(ongkir);
  return { jarakKm, estimasiMenit, ongkir, biayaLayanan };
}

// POST /api/orders — buat order jastip / suruh
router.post('/', requireUser, validate(createOrderSchema), async (req: Request, res: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
const user = getUser(req)!;
    const body = req.body ?? { /* ignore */ };
    const orderType: string = body.orderType === 'suruh' ? 'suruh' : 'jastip';
    const serviceName: string = orderType === 'suruh' ? 'Truzzi Suruh' : 'Jastip Truzzi';
    const title: string = (body.title ||
      body.item ||
      (orderType === 'suruh' ? 'Tugas Suruh' : 'Barang Jastip')) as string;
    const description: string = (body.description || body.notes || '') as string;

    const danaBelanja = Math.max(0, Number(body.danaBelanja ?? body.budget ?? 0) || 0);

    const { jarakKm, estimasiMenit, ongkir, biayaLayanan } = await computePricing(body);
    // Boleh override ongkir/biayaLayanan dari request (jika frontend sudah menghitung identik atau direct invoice)
    const finalOngkir =
      Number.isFinite(Number(body.ongkir)) && Number(body.ongkir) >= 0
        ? Number(body.ongkir)
        : ongkir;
    const finalFee =
      Number.isFinite(Number(body.biayaLayanan)) && Number(body.biayaLayanan) >= 0
        ? Number(body.biayaLayanan)
        : biayaLayanan;
    const total = body.totalAmount
      ? Number(body.totalAmount)
      : hitungTotal(danaBelanja, finalOngkir, finalFee);

    const nowIso = new Date().toISOString();
    // Jika pesanan langsung dari deal Jastiper (direct chat invoice)
    let assignedJastiperId = (body.jastiperId || body.jastiperId || '') as string;
    let jastiperName = '';
    let jastiperPhone = '';
    let jastiperAvatar = '';

    if (assignedJastiperId) {
      // Cari data jastiper / jastiper
      const jastiper = await db.getJastiper(assignedJastiperId);
      const jastiperDoc =
        (await db.getJastiper(assignedJastiperId)) ||
        (jastiper?.jastiperId ? await db.getJastiper(jastiper.jastiperId) : null);
      if (jastiperDoc) {
        assignedJastiperId = jastiperDoc.id;
        jastiperName = jastiperDoc.name || jastiper?.name || 'Jastiper Truzzi';
        jastiperPhone = jastiperDoc.phone || '';
        jastiperAvatar = jastiperDoc.photoUrl || jastiper?.photoUrl || '';
      } else if (jastiper) {
        jastiperName = jastiper.name || 'Jastiper Truzzi';
        jastiperPhone = jastiper.phone || '';
        jastiperAvatar = jastiper.photoUrl || '';
      }
    }

    const orderData: Record<string, unknown> = {
      userId: user.id,
      type: orderType,
      serviceName,
      title,
      item: title,
      description,
      notes: description,
      status: 'ongoing',
      statusText: assignedJastiperId
        ? 'Jastiper Menuju Lokasi Belanja'
        : 'Dana Diamankan — Mencari Kurir',
      totalAmount: total,
      totalPrice: total,
      createdAt: nowIso,
      updatedAt: nowIso,
      jastiperId: assignedJastiperId || '',
      jastiperName: jastiperName || '',
      jastiperPhone: jastiperPhone || '',
      jastiperAvatar: jastiperAvatar || '',
      pickupAddress: (body.pickupAddress ||
        body.pickup ||
        (orderType === 'suruh' ? 'Lokasi Penjemputan' : 'Lokasi Penjual')) as string,
      // legacy alias kolom (Appwrite asli menyimpan 'pickupLocation' & 'dropoffLocation')
      pickupLocation: (body.pickupAddress || body.pickup || '') as string,
      deliveryAddress: (body.deliveryAddress ||
        body.dropoff ||
        (orderType === 'suruh' ? 'Lokasi Tujuan' : 'Alamat Tujuan')) as string,
      dropoffLocation: (body.deliveryAddress || body.dropoff || '') as string,
      danaBelanja,
      ongkir: finalOngkir,
      biayaLayanan: finalFee,
      pickupLat: Number.isFinite(Number(body.pickupLat)) ? Number(body.pickupLat) : null,
      pickupLng: Number.isFinite(Number(body.pickupLng)) ? Number(body.pickupLng) : null,
      dropoffLat: Number.isFinite(Number(body.dropoffLat)) ? Number(body.dropoffLat) : null,
      dropoffLng: Number.isFinite(Number(body.dropoffLng)) ? Number(body.dropoffLng) : null,
      jarakKm,
      estimasiWaktu: `~${estimasiMenit} menit`,
      kebijakanLebih: body.kebijakanLebih === 'boleh_lebih' ? 'boleh_lebih' : 'jangan_lebih',
      pendingApproval: false,
      voucherCode: body.voucherCode ?? null,
      voucherDiscount: body.voucherDiscount ?? null,
      orderType,
      chatRoomId: body.orderId || '',
    };

    // Cek saldo wallet SEBELUM membuat order (hindari order bocor saat saldo kurang).
    if (total > 0) {
      const walletCheck = await db.ensureWallet(user.id);
      const balanceCheck = Number(walletCheck.balance ?? 0) || 0;
      if (balanceCheck < total) {
        return res.status(402).json({
          code: 'INSUFFICIENT_BALANCE',
          message: `Saldo TruzziPay tidak cukup. Saldo: Rp ${Math.round(balanceCheck)}, Dibutuhkan: Rp ${Math.round(total)}`,
          needed: total,
          balance: balanceCheck,
        });
      }
    }

    const order = await db.createOrder(orderData);

    // Pembayaran = debit wallet + dana diamankan escrow (sama dgn Flutter `deductAndEscrow`).
    if (total > 0) {
      const wallet = await db.ensureWallet(user.id);
      const balance = Number(wallet.balance ?? 0) || 0;
      const nowIso2 = new Date().toISOString();
      await db.updateWallet(user.id, {
        balance: balance - total,
        totalSpent: Number(wallet.totalSpent ?? 0) + total,
        updatedAt: nowIso2,
      });
      const escrowId = `es_order_${order.$id ?? order.id}`;
      await db.createEscrow({
        $id: escrowId,
        orderId: order.$id ?? order.id,
        userId: user.id,
        amount: total,
        status: 'held',
        serviceType: orderType,
        createdAt: nowIso2,
        danaBelanja,
        ongkir: finalOngkir,
        biayaLayanan: finalFee,
      });
    }

    // Deduct Promo Quota & Budget
    if (orderData.voucherCode && orderData.voucherDiscount) {
      try {
        const promo = await getPrisma().promo.findUnique({
          where: { code: orderData.voucherCode as string },
        });
        if (promo) {
          await getPrisma().promo.update({
            where: { id: promo.id },
            data: {
              usedCount: promo.usedCount + 1,
              budgetUsed: promo.budgetUsed + (orderData.voucherDiscount as number),
            },
          });
          // Update existing claim or create new if not claimed previously
          const existingClaim = await getPrisma().userPromo.findFirst({
            where: { userId: user.id, promoId: promo.id, orderId: null },
          });
          if (existingClaim) {
            await getPrisma().userPromo.update({
              where: { id: existingClaim.id },
              data: { orderId: order.$id ?? order.id },
            });
          } else {
            await getPrisma().userPromo.create({
              data: {
                userId: user.id,
                promoId: promo.id,
                orderId: order.$id ?? order.id,
              },
            });
          }
        }
      } catch (err) {
        console.error('Failed to deduct promo quota:', err);
      }
    }

    const notifTitle =
      orderType === 'suruh' ? 'Pesanan Suruh Kurir Dibuat 📦' : 'Pesanan Jastip Dibuat 📦';
    const notifBody =
      orderType === 'suruh'
        ? 'Pesanan Suruh Kurir Anda telah berhasil dibuat. Kurir akan segera menuju lokasi.'
        : 'Pesanan Jastip Belanja Anda telah berhasil dibuat. Kurir akan segera diproses.';
    await createNotification({
      userId: user.id,
      category: 'Pesanan',
      title: notifTitle,
      body: notifBody,
      routeName: '/tracking',
      routeExtra: order.$id ?? order.id,
    });

    if (assignedJastiperId) {
      await createNotification({
        userId: assignedJastiperId,
        category: 'Pesanan',
        title: 'Pesanan Baru Masuk! 🎉',
        body: `Ada pesanan ${orderType === 'suruh' ? 'Truzzi Suruh' : 'Jastip'} baru dari ${user.name}. Segera cek rinciannya!`,
        routeName: '/order-detail',
        routeExtra: order.$id ?? order.id,
      });
    }

    res.status(201).json({ order });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal membuat pesanan' });
  }
});

// GET /api/orders?userId=  (daftar order milik user; urut createdAt desc)
router.get('/', requireUser, async (req: Request, res: Response) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
const user = getUser(req)!;
  const orders = await db.listOrders(user.id);

  // Attach ulasan customer ke masing-masing order bila ada
  const enrichedOrders = await Promise.all(
    orders.map(async (o: any) => {
      try {
        const reviews = await db.getOrderReviews(o.$id || o.id);
        const myRev = reviews.find((r: any) => r.userId === user.id) || reviews[0];
        if (myRev) {
          return {
            ...o,
            myRating: myRev.rating,
            jastiperRating: myRev.rating,
            reviewComment: myRev.comment,
          };
        }
      } catch { /* ignore */ }
      return o;
    }),
  );

  res.json({ orders: enrichedOrders });
});

// GET /api/orders/:id
router.get('/:id', requireUser, async (req: Request, res: Response) => {
  const order = await db.getOrder(req.params.id);
  if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
  res.json({ order });
});

// PATCH /api/orders/:id — status, struk, proof, refund, pendingApproval, dst.
router.patch('/:id', requireUser, async (req: Request, res: Response) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
const user = getUser(req)!;
    if (order.userId !== user.id) return res.status(403).json({ message: 'Bukan pesanan Anda' });

    const patch: Record<string, unknown> = { /* ignore */ };
    const body = req.body ?? { /* ignore */ };
    const allowedFields = [
      'status',
      'statusText',
      'jastiperId',
      'jastiperName',
      'jastiperPhone',
      'jastiperAvatar',
      'jastiperLat',
      'jastiperLng',
      'totalBelanjaStruk',
      'strukImageUrl',
      'deliveryProofUrl',
      'refundCustomer',
      'pendingApproval',
      'requestedTopup',
    ];
    for (const f of allowedFields) {
      if (body[f] !== undefined && body[f] !== null) patch[f] = body[f];
    }

    // Hitung settlement escrow bila meng-upload struk
    if (body.totalBelanjaStruk !== undefined && body.totalBelanjaStruk !== null) {
      const danaBelanja = Number(order.danaBelanja ?? 0) || 0;
      const ongkir = Number(order.ongkir ?? 0) || 0;
      const biayaLayanan = Number(order.biayaLayanan ?? 0) || 0;
      const totalStruk = Number(body.totalBelanjaStruk) || 0;
      const kebijakan = (order.kebijakanLebih ?? 'jangan_lebih') as 'jangan_lebih' | 'boleh_lebih';

      const settlement = hitungSettlement({
        danaBelanja,
        totalBelanjaStruk: totalStruk,
        ongkir,
        biayaLayanan,
        kebijakanLebih: kebijakan,
      });
      if (settlement.invalid) {
        return res.status(400).json({
          message:
            'Total belanja melebihi dana dan kebijakan "jangan lebih" — pesanan tidak dapat diselesaikan dengan struk ini.',
        });
      }
      patch.totalBelanjaStruk = totalStruk;
      patch.refundCustomer = settlement.refundCustomer;
      if (settlement.isOverBudget) {
        patch.pendingApproval = true;
        patch.requestedTopup = totalStruk - (order.danaBelanja ?? 0);
      } else {
        patch.pendingApproval = false;
      }
    }

    const updated = await db.updateOrder(req.params.id, patch);
    res.json({ order: updated });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal memperbarui pesanan' });
  }
});

// GET /api/orders/:id/jastiper — data kurir via jastiperId
router.get('/:id/jastiper', requireUser, async (req: Request, res: Response) => {
  const order = await db.getOrder(req.params.id);
  if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
  if (!order.jastiperId) return res.json({ jastiper: null });
  const jastiper = await db.getJastiper(order.jastiperId);
  const safeJastiper = jastiper
    ? (() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { kycKtpUrl, kycSelfieUrl, ...safe } = jastiper;
        return safe;
      })()
    : null;
  res.json({ jastiper: safeJastiper });
});

// POST /api/orders/:id/escrow — buat escrow transaction eksplisit
router.post('/:id/escrow', requireUser, async (req: Request, res: Response) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    const body = req.body ?? { /* ignore */ };
    const escrow = await db.createEscrow({
      orderId: req.params.id,
      userId: order.userId,
      amount: Number(body.amount ?? order.totalAmount ?? 0) || 0,
      status: body.status ?? 'held',
      serviceType: order.orderType ?? order.type ?? 'jastip',
      createdAt: new Date().toISOString(),
      danaBelanja: Number(order.danaBelanja ?? 0) || 0,
      ongkir: Number(order.ongkir ?? 0) || 0,
      biayaLayanan: Number(order.biayaLayanan ?? 0) || 0,
    });
    res.status(201).json({ escrow });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal membuat escrow' });
  }
});

// POST /api/orders/:id/report — laporkan masalah pesanan
router.post('/:id/report', requireUser, async (req: Request, res: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
const user = getUser(req)!;
    const body = req.body ?? { /* ignore */ };
    const report = await db.createOrderReport({
      orderId: req.params.id,
      userId: user.id,
      reason: body.reason || body.category || 'Kendala Pesanan',
      details: body.details || body.description || '',
      images: body.images || [],
    });
    await createNotification({
      userId: user.id,
      category: 'Bantuan',
      title: 'Laporan Diterima 📋',
      body: `Laporan Anda untuk pesanan #${req.params.id.slice(0, 8)} sedang ditinjau oleh Customer Service Truzzi.`,
      routeName: '/chat/room',
      routeExtra: 'room_cs',
    });
    res.status(201).json({ report, ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal membuat laporan pesanan' });
  }
});

// POST /api/orders/:id/review — beri ulasan & rating pesanan
router.post('/:id/review', requireUser, async (req: Request, res: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
const user = getUser(req)!;
    const body = req.body ?? { /* ignore */ };
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
    const comment = body.comment || body.review || '';

    // Update review data to the order itself
    const review = await db.updateOrder(req.params.id, {
      reviewRating: rating,
      reviewText: comment,
    });

    // Update rating jastiper/jastiper terkait
    const order = await db.getOrder(req.params.id);
    if (order?.jastiperId) {
      const jastiperId = order.jastiperId;
      try {
        const jastiper = await db.getJastiper(jastiperId);
        if (jastiper) {
          const currentTotal = Number(jastiper.totalOrders || 0);
          const currentRating = Number(jastiper.rating || 0);
          // Rata-rata baru jika sebelumnya 0
          const newRating =
            currentTotal === 0 || currentRating === 0
              ? rating
              : Number(((currentRating * currentTotal + rating) / (currentTotal + 1)).toFixed(1));

          await db.upsertJastiper(jastiperId, {
            rating: newRating,
            totalOrders: currentTotal + 1,
          });
        }
      } catch (err) {
        console.error('Error updating jastiper rating:', err);
      }
    }

    res.status(201).json({ review, ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal menyimpan ulasan pesanan' });
  }
});

// POST /api/orders/:id/generate-resi — buat nomor resi pengiriman
router.post('/:id/generate-resi', requireUser, async (req: Request, res: Response) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    const resi = `SGO-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const updated = await db.updateOrder(req.params.id, {
      resi,
      statusText: `Pengiriman dengan no resi ${resi}`,
    });
    res.json({ order: updated, resi });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal membuat nomor resi' });
  }
});

// POST /api/orders/:id/cancel — batalkan pesanan
router.post('/:id/cancel', requireUser, async (req: Request, res: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
const user = getUser(req)!;
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

    // Validasi permission & status: selesai tidak bisa dibatalkan
    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Pesanan yang sudah selesai tidak dapat dibatalkan' });
    }

    const updated = await db.updateOrder(req.params.id, {
      status: 'cancelled',
      statusText: 'Pesanan Dibatalkan',
      updatedAt: new Date().toISOString(),
    });

    if (order.jastiperId) {
      await createNotification({
        userId: order.jastiperId,
        category: 'Pesanan',
        title: 'Pesanan Dibatalkan ❌',
        body: `Pesanan "${order.title}" telah dibatalkan oleh pelanggan.`,
        routeName: '/order-detail',
        routeExtra: order.$id ?? order.id,
      });
    }

    // Refund ke wallet jika ada dana yang di-escrow dan belum selesai
    const total = Number(order.totalAmount ?? 0);
    if (total > 0 && order.userId === user.id) {
      const wallet = await db.ensureWallet(user.id);
      const balance = Number(wallet.balance ?? 0) || 0;
      await db.updateWallet(user.id, {
        balance: balance + total,
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({ order: updated, message: 'Pesanan berhasil dibatalkan' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal membatalkan pesanan' });
  }
});

// POST /api/orders/:id/take — kurir/jastipper mengambil pesanan
router.post('/:id/take', requireUser, async (req: Request, res: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
const user = getUser(req)!;
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    if (order.jastiperId && order.jastiperId !== user.id) {
      return res.status(400).json({ message: 'Pesanan sudah diambil oleh kurir lain' });
    }

    const updated = await db.updateOrder(req.params.id, {
      jastiperId: user.id,
      jastiperName: user.name,
      jastiperPhone: user.phone || '',
      jastiperAvatar: user.photoUrl || '',
      status: 'processing',
      statusText: 'Kurir Menuju Lokasi Pembelian',
      updatedAt: new Date().toISOString(),
    });

    await createNotification({
      userId: order.userId,
      category: 'Pesanan',
      title: 'Kurir Menuju Lokasi 🛵',
      body: `${user.name} telah mengambil pesanan Anda dan sedang menuju lokasi.`,
      routeName: '/tracking',
      routeExtra: order.$id ?? order.id,
    });

    res.json({ order: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Gagal mengambil pesanan' });
  }
});

export default router;



