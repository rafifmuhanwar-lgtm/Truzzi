import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from '../config.js';

import { getUser, requireUser, setSessionCookie, clearSessionCookie, signSession, readSessionToken, verifySession, detectApp, type SessionUser } from '../services/session.js';
import * as db from '../services/data.js';
import { getPrisma } from '../services/prisma-client.js';

function getCookieName(app?: string): string {
  if (app === 'driver') return config.session.cookieNameDriver;
  if (app === 'customer') return config.session.cookieNameCustomer;
  return config.session.cookieName;
}

const router = Router();

const registerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  phone: z.string().optional(),
  selectedArea: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

/** Cari user by email di Postgres. */
async function findUserByEmail(email: string) {
  return getPrisma().user.findUnique({ where: { email: email.toLowerCase() } });
}

/** Buat sesi web dari sebuah user (Postgres atau Appwrite/demo) → JWT + cookie. */
async function issueSession(res: Response, user: SessionUser, app?: string): Promise<void> {
  if (config.data.engine === 'postgres') {
    // Ambil role terkini dari DB agar tidak pernah stale di JWT.
    const row = await getPrisma().user.findUnique({ where: { id: user.id }, select: { role: true } });
    user.role = row?.role === 'jastiper' ? 'jastiper' : 'customer';
  }
  await db.upsertUserDoc(user);
  setSessionCookie(res, signSession(user), getCookieName(app));
}



// POST /api/auth/register {name,email,password,phone?,selectedArea?}
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.issues[0].message });
    }
    const { name, email, password, phone, selectedArea } = parseResult.data;

    const app = detectApp(req);

    // ── Postgres engine ──
    if (config.data.engine === 'postgres') {
      const exists = await findUserByEmail(email);
      if (exists) return res.status(400).json({ message: 'Email sudah terdaftar' });
      const hash = await bcrypt.hash(password, 10);
      const user: SessionUser = { id: `usr_${Date.now().toString(36)}${Math.random().toString(16).slice(2, 8)}`, name: name.trim(), email: email.toLowerCase(), phone: phone ?? null };
      const created = await getPrisma().user.create({
        data: { id: user.id, name: user.name, email: user.email, passwordHash: hash, phone: user.phone ?? null, selectedArea: selectedArea ?? null },
      });
      await issueSession(res, { id: created.id, name: created.name, email: created.email, phone: created.phone }, app);
      return res.status(201).json({ user: { id: created.id, name: created.name, email: created.email, phone: created.phone }, engine: 'postgres' });
    }

  } catch (e: any) {
    res.status(400).json({ message: e.message || 'Gagal mendaftar' });
  }
});

// POST /api/auth/login {email,password}
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: parseResult.error.issues[0].message });
    }
    const { email, password } = parseResult.data;

    const app = detectApp(req);

    // ── Postgres engine ──
    if (config.data.engine === 'postgres') {
      const userRow = await findUserByEmail(email);
      if (!userRow) return res.status(401).json({ message: 'Login Gagal: Email tidak terdaftar' });
      if (!userRow.passwordHash) return res.status(401).json({ message: 'Login Gagal: Akun ini tidak memiliki password (mungkin via Google)' });

      const ok = await bcrypt.compare(password, userRow.passwordHash);
      if (!ok) return res.status(401).json({ message: 'Login Gagal: Password salah' });

      const user: SessionUser = { id: userRow.id, name: userRow.name, email: userRow.email, phone: userRow.phone, photoUrl: userRow.photoUrl, selectedArea: userRow.selectedArea, role: userRow.role === 'jastiper' ? 'jastiper' : 'customer' };
      await issueSession(res, user, app);
      return res.json({ user });
    }

  } catch (e: any) {
    res.status(401).json({ message: `Login Gagal: ${e.message || 'Terjadi kesalahan internal'}` });
  }
});

// POST /api/auth/google — mulai OAuth Google.
// Engine postgres → Google OAuth 2.0 mandiri (client ID/Secret dari .env).
// Engine appwrite → Appwrite OAuth2.
router.post('/google', (req: Request, res: Response) => {
  const redirectUri = `${config.server.webOrigin}/#/google/callback`;
  const params = new URLSearchParams({
    client_id: config.google.clientId || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.json({ url });
});

// POST /api/auth/google/callback — tukar kode OAuth Google dengan token.
router.post('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body ?? {};
    if (!code) return res.status(400).json({ message: 'Code wajib diisi' });

    const app = detectApp(req);
    const redirectUri = `${config.server.webOrigin}/#/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: config.google.clientId!,
        client_secret: config.google.clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; id_token?: string };
    if (!tokenData.access_token) return res.status(401).json({ message: 'Gagal menukar code Google' });

    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const info = await infoRes.json() as { id?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };

    if (!info.email) return res.status(401).json({ message: 'Email Google tidak ditemukan' });

    // Cari/ciptakan user by googleId atau email
    let row = await getPrisma().user.findUnique({ where: { email: info.email.toLowerCase() } });
    if (!row) {
      row = await getPrisma().user.create({
        data: {
          id: `usr_${Date.now().toString(36)}${Math.random().toString(16).slice(2, 8)}`,
          name: info.name ?? 'Pengguna Google',
          email: info.email.toLowerCase(),
          googleId: info.id ?? null,
          photoUrl: info.picture ?? null,
        },
      });
    } else if (info.id && !row.googleId) {
      row = await getPrisma().user.update({ where: { id: row.id }, data: { googleId: info.id } });
    }

    const user: SessionUser = { id: row.id, name: row.name, email: row.email, phone: row.phone, photoUrl: row.photoUrl ?? info.picture ?? null, selectedArea: row.selectedArea };
    await issueSession(res, user, app);
    res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Login Google gagal' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  const app = detectApp(req);
  const token = readSessionToken(req, getCookieName(app));
  const user = token ? verifySession(token) : null;
  if (!user) return res.status(401).json({ message: 'Anda belum masuk' });
  const doc = await db.getUserDoc(user.id);
  res.json({
    user: {
      ...user,
      photoUrl: doc?.photoUrl ?? user.photoUrl ?? null,
      selectedArea: doc?.selectedArea ?? user.selectedArea ?? null,
      phone: doc?.phone ?? user.phone ?? null,
      role: (doc?.role as string) === 'jastiper' || user.role === 'jastiper' ? 'jastiper' : 'customer',
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  const app = detectApp(req);
  clearSessionCookie(res, getCookieName(app));
  res.json({ ok: true });
});

// PUT /api/auth/profile {name, phone, photoUrl?, selectedArea?}
router.put('/profile', requireUser, async (req: Request, res: Response) => {
  try {
    const user = getUser(req)!;
    const app = detectApp(req);
    const { name, phone, photoUrl, selectedArea } = req.body ?? {};
    const update: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (typeof phone === 'string') update.phone = phone;
    if (typeof photoUrl === 'string') update.photoUrl = photoUrl;
    if (typeof selectedArea === 'string') update.selectedArea = selectedArea;

    const doc = await db.updateUserDoc(user.id, update);
    const updated: SessionUser = {
      id: user.id,
      name: (update.name as string) ?? user.name,
      email: user.email,
      phone: (update.phone as string) || doc?.phone || user.phone || null,
      photoUrl: (update.photoUrl as string) || doc?.photoUrl || user.photoUrl || null,
      selectedArea: (update.selectedArea as string) || doc?.selectedArea || user.selectedArea || null,
    };
    setSessionCookie(res, signSession(updated), getCookieName(app));
    res.json({ user: updated });
  } catch (e: any) {
    res.status(400).json({ message: e.message || 'Gagal memperbarui profil' });
  }
});

export default router;

