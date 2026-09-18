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

// GET /api/addresses — daftar alamat milik user
router.get('/', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  const addresses = await db.listAddresses(user.id);
  res.json({ addresses });
});

// POST /api/addresses — tambah alamat
router.post('/', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const body = req.body ?? {};
    const list = await db.listAddresses(user.id);
    const isFirst = list.length === 0;
    const addressId = `addr_${Date.now().toString(36)}${Math.random().toString(16).slice(2, 6)}`;
    const saved = await db.saveAddress(addressId, user.id, {
      label: body.label || 'Rumah',
      recipientName: body.recipientName || user.name || '',
      phone: body.phone || user.phone || '',
      province: body.province || '',
      city: body.city || '',
      district: body.district || '',
      village: body.village || '',
      postalCode: body.postalCode || '',
      fullAddress: body.fullAddress || '',
      details: body.details ?? '',
      isPrimary: body.isPrimary === true || isFirst,
    });
    res.status(201).json({ address: { id: addressId, ...saved } });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal menyimpan alamat' });
  }
});

// PATCH /api/addresses/:id
router.patch('/:id', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const body = req.body ?? {};
    const upd: Record<string, unknown> = {};
    if (body.label !== undefined) upd.label = body.label;
    if (body.recipientName !== undefined) upd.recipientName = body.recipientName;
    if (body.phone !== undefined) upd.phone = body.phone;
    if (body.province !== undefined) upd.province = body.province;
    if (body.city !== undefined) upd.city = body.city;
    if (body.district !== undefined) upd.district = body.district;
    if (body.village !== undefined) upd.village = body.village;
    if (body.postalCode !== undefined) upd.postalCode = body.postalCode;
    if (body.fullAddress !== undefined) upd.fullAddress = body.fullAddress;
    if (body.details !== undefined) upd.details = body.details;
    if (body.isPrimary === true) {
      // demote semua yang sebelumnya primary
      const list = await db.listAddresses(user.id);
      for (const a of list) {
        if (a.$id !== req.params.id && a.isPrimary === true) {
          await db.saveAddress(a.$id, user.id, { ...a, isPrimary: false });
        }
      }
      upd.isPrimary = true;
    }
    const saved = await db.saveAddress(req.params.id, user.id, upd);
    res.json({ address: { id: req.params.id, ...saved } });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal memperbarui alamat' });
  }
});

// DELETE /api/addresses/:id
router.delete('/:id', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  // Pastikan milik user
  const list = await db.listAddresses(user.id);
  if (!list.some((a) => (a.$id ?? a.id) === req.params.id)) {
    return res.status(403).json({ message: 'Bukan alamat Anda' });
  }
  await db.deleteAddress(req.params.id);
  res.json({ ok: true });
});

export default router;