import { Router, type Request, type Response, type NextFunction } from 'express';
import { config } from '../config.js';
import { getUser, requireUser, readSessionToken, verifySession } from '../services/session.js';
import * as db from '../services/data.js';
import * as buatqris from '../services/buatqris.js';
import { formatRupiah } from '../services/format.js';
import { createNotification } from '../services/data.js';

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

// Middleware to attach user from app-specific cookie (except webhook)
router.use((req: Request, _res: Response, next: NextFunction) => {
  // Skip middleware for webhook endpoint (no user session needed)
  if (req.path === '/webhook') return next();
  const app = detectApp(req);
  const cookieName = getCookieName(app);
  const token = readSessionToken(req, cookieName);
  const user = token ? verifySession(token) : null;
  if (user) {
    (req as Request & { user?: typeof user }).user = user;
  }
  next();
});

/** Kredit saldo wallet + tandai transaksi sukses + notifikasi. Idempoten. */
async function creditTopUp(txn: any): Promise<void> {
  if ((txn.status ?? 'pending') === 'completed') return; // sudah diproses
  const amount = Number(txn.amount ?? 0);
  const wallet = await db.ensureWallet(txn.userId);
  await db.updateWallet(txn.userId, {
    balance: Number(wallet.balance ?? 0) + amount,
    totalTopUp: Number(wallet.totalTopUp ?? 0) + amount,
    updatedAt: new Date().toISOString(),
  });
  await db.updateTopUp(txn.$id ?? txn.id, { status: 'completed', completedAt: new Date().toISOString() });
  await createNotification({
    userId: txn.userId,
    category: 'Sistem & Akun',
    title: 'Top Up TruzziPay Berhasil 💳',
    body: `Saldo TruzziPay Wallet bertambah ${formatRupiah(amount)}.`,
    routeName: '/profile/payment',
  });
}

// POST /api/topup {amount, method:'qris'} → buat transaksi BuatQris + simpan topup_transactions
router.post('/', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const amount = Math.round(Number(req.body?.amount ?? 0)) || 0;
    const method = req.body?.method ?? 'qris';
    if (amount < 10000) return res.status(400).json({ message: 'Minimal top up Rp 10.000' });

    const txn = await db.createTopUp({
      $id: `tp_${Date.now().toString(36)}${Math.random().toString(16).slice(2, 8)}`,
      userId: user.id,
      amount,
      paymentMethod: method,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
    });

    // Mode demo / provider belum dikonfigurasi → QR tiruan agar alur tetap bisa dites.
    const provider = config.payment.provider;
    if (provider === 'demo' || config.demo.enabled) {
      return res.status(201).json({
        topup: txn,
        payment: {
          qr_url: '',
          qris_image: '',
          payment_url: '',
          total_amount: amount,
          status: 'pending',
          demo: true,
          message: 'PAYMENT_PROVIDER=demo — QRIS tiruan.',
        },
      });
    }
    if (provider === 'buatqris' && !config.buatqris.accountId) {
      return res.status(201).json({
        topup: txn,
        payment: { total_amount: amount, status: 'pending', demo: true, message: 'BUATQRIS_ACCOUNT_ID belum diisi — mode demo.' },
      });
    }

    const callbackUrl = `${config.server.webOrigin.replace(/\/$/, '')}/api/topup/webhook`;
    const isTest = config.buatqris.sandbox && config.payment.provider === 'buatqris';
    // Coba beberapa metode QRIS berurutan; biarkan default bila gagal semua.
    const qrisMethods = req.body?.qrisMethod ? [req.body.qrisMethod] : ['qris_one', 'qris_two', 'qris_three', 'qris_four'];
    let result: Awaited<ReturnType<typeof buatqris.createQris>> | null = null;
    let lastError = '';
    for (const m of qrisMethods) {
      try {
        const r = await buatqris.createQris({
          amount,
          description: `Top up TruzziPay ${user.name}`,
          qrisMethod: m,
          callbackUrl,
          test: isTest,
          // tanpa umkm_name → pakai nama toko default akun (hindari error custom name)
        });
        if (r.success && r.data?.transaction_id) {
          result = r;
          break;
        }
        lastError = r.message || '';
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    if (!result || !result.data?.transaction_id) {
      return res.status(400).json({ message: lastError || 'Gagal membuat pembayaran BuatQris' });
    }

    // Simpan transaction_id BuatQris di pakasirOrderId (kolom lama) supaya bisa check status.
    const txnId = result.data.transaction_id;
    await db.updateTopUp(txn.$id ?? txn.id, { pakasirOrderId: txnId });

    res.status(201).json({
      topup: { ...txn, pakasirOrderId: txnId },
      payment: {
        transaction_id: txnId,
        qr_url: result.data.qr_url ?? '',
        qris_image: result.data.qris_image ?? '',
        payment_url: result.data.payment_url ?? '',
        total_amount: result.data.total_amount ?? amount,
        amount: result.data.amount ?? amount,
        status: result.data.status ?? 'pending',
        is_test: isTest,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: `Gagal membuat pembayaran: ${e instanceof Error ? e.message : e}` });
  }
});

// POST /api/topup/webhook — webhook BuatQris (verify HMAC, kredit saldo)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    // Gunakan raw body persis seperti diterima (HMAC dihitung dari bytes mentah).
    const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);
    const sig = req.headers['x-buatqris-signature'] as string | undefined;
    const event = req.headers['x-buatqris-event'] as string | undefined;

    // Verifikasi signature bila signing secret dikonfigurasi
    if (config.buatqris.signingSecret) {
      const valid = buatqris.verifySignature(rawBody, sig);
      if (!valid) return res.status(401).json({ ok: false, message: 'Signature tidak valid' });
    }

    const payload = req.body as any;
    const transactionId = String(payload.transaction_id ?? '');

    if (event === 'payment.success' || payload.event === 'payment.success' || payload.status === 'success') {
      const txn = await db.getTopUpByRef(transactionId);
      if (txn) {
        await creditTopUp(txn);
        console.log(`[buatqris] topup ${transactionId} sukses, saldo dikredit`);
      } else {
        console.log(`[buatqris] webhook success untuk transaksi tak dikenal: ${transactionId}`);
      }
    } else if (event === 'payment.expired' || event === 'payment.failed' || payload.status === 'expired' || payload.status === 'failed') {
      const txn = await db.getTopUpByRef(transactionId);
      if (txn && (txn.status ?? 'pending') === 'pending') {
        await db.updateTopUp(txn.$id ?? txn.id, { status: 'failed' });
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// GET /api/topup/:id — detail + poll status
router.get('/:id', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  const txn = await db.getTopUp(req.params.id);
  if (!txn) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
  if (txn.userId !== user.id) return res.status(403).json({ message: 'Bukan transaksi Anda' });

  let status = txn.status ?? 'pending';
  const refId = (txn.pakasirOrderId as string) || '';

  if (config.demo.enabled && status === 'pending') {
    if (txn.createdAt && Date.now() - Date.parse(txn.createdAt) > 8000) status = 'completed';
  }

  // Poll ke BuatQris bila pending & punya transaction_id
  if (!config.demo.enabled && status === 'pending' && refId) {
    try {
      const detail = await buatqris.checkStatus(refId);
      const st = detail.data?.status;
      if (st === 'success') status = 'completed';
      else if (st === 'failed' || st === 'expired') status = 'failed';
    } catch {
      /* keep pending */
    }
  }

  if (status === 'completed' && (txn.status ?? 'pending') !== 'completed') {
    await creditTopUp(txn);
  } else if (status === 'failed' && (txn.status ?? 'pending') !== 'failed') {
    await db.updateTopUp(req.params.id, { status: 'failed' });
  }

  const fresh = (await db.getTopUp(req.params.id)) ?? txn;
  res.json({ topup: { ...fresh, status: fresh.status ?? status } });
});

// POST /api/topup/:id/simulate — mode test/sandbox BuatQris: tandai lunas via test_pay
// Di sandbox: panggil test_pay → BuatQris kirim webhook payment.success → server kredit saldo via webhook.
router.post('/:id/simulate', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  const txn = await db.getTopUp(req.params.id);
  if (!txn) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
  if (txn.userId !== user.id) return res.status(403).json({ message: 'Bukan transaksi Anda' });

  const refId = (txn.pakasirOrderId as string) || '';
  const isSandbox = config.payment.provider === 'buatqris' && config.buatqris.sandbox;

  if (!config.demo.enabled && isSandbox && refId) {
    // test_pay menandai transaksi test lunas; webhook payment.success akan mengkredit saldo.
    try {
      await buatqris.testPay(refId);
      console.log(`[buatqris] test_pay ${refId} — menunggu webhook payment.success`);
      // Jangan kredit di sini; biarkan webhook melakukannya (uji alur penuh).
      const fresh = (await db.getTopUp(req.params.id)) ?? txn;
      return res.json({ topup: fresh, waitingWebhook: true, message: 'Menandai lunas (test). Saldo dikredit setelah webhook.' });
    } catch (e) {
      console.error('[buatqris] test_pay gagal:', e instanceof Error ? e.message : e);
      // Fallback: bila test_pay ditolak (mis. butuh sesi login pemilik), kredit lokal agar tetap bisa uji.
      await creditTopUp(txn);
      const completed = (await db.getTopUp(req.params.id)) ?? txn;
      return res.json({ topup: completed, fallback: true });
    }
  }

  // Non-sandbox / demo → kredit langsung (perilaku lama).
  await creditTopUp(txn);
  const completed = (await db.getTopUp(req.params.id)) ?? txn;
  res.json({ topup: completed });
});

export default router;