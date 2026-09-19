import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  selectedArea?: string | null;
  role?: 'customer' | 'jastiper';
}

export function signSession(user: SessionUser): string {
  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      photoUrl: user.photoUrl ?? '',
      selectedArea: user.selectedArea ?? '',
      role: user.role ?? 'customer',
    },
    config.session.jwtSecret,
    { expiresIn: '30d' },
  );
}

export function verifySession(token: string): SessionUser | null {
  try {
    const payload = jwt.verify(token, config.session.jwtSecret) as JwtPayload & {
      sub?: string;
      name?: string;
      email?: string;
      phone?: string;
      photoUrl?: string;
      selectedArea?: string;
      role?: string;
    };
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      name: payload.name ?? '',
      email: payload.email ?? '',
      phone: payload.phone || null,
      photoUrl: payload.photoUrl || null,
      selectedArea: payload.selectedArea || null,
      role: payload.role === 'jastiper' ? 'jastiper' : 'customer',
    };
  } catch {
    return null;
  }
}

const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
  maxAge: 30 * 24 * 60 * 60 * 1000,
  secure: isProd,
  path: '/',
};

export function readSessionToken(req: Request, cookieName?: string): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  const name = cookieName ?? config.session.cookieName;
  const cookie = req.cookies?.[name];
  if (cookie) return String(cookie);
  return null;
}

export function setSessionCookie(res: Response, token: string, cookieName?: string): void {
  res.cookie(cookieName ?? config.session.cookieName, token, COOKIE_OPTS);
}

export function clearSessionCookie(res: Response, cookieName?: string): void {
  res.clearCookie(cookieName ?? config.session.cookieName, { path: '/' });
}

/** Helper to detect app from header or origin */
export function detectApp(req: Request): string | undefined {
  const appHeader = req.headers['x-app'];
  if (appHeader === 'driver') return 'driver';
  if (appHeader === 'customer') return 'customer';
  const origin = req.headers.origin ?? '';
  if (origin.includes(':5174') || origin.includes('driver')) return 'driver';
  if (origin.includes(':5173') || origin.includes('customer')) return 'customer';
  return undefined;
}

/** Populate req.user from JWT if valid. Checks driver, customer, or default cookie / auth header. */
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const app = detectApp(req);
  let token: string | null = null;

  if (app === 'driver') {
    token = readSessionToken(req, config.session.cookieNameDriver) || readSessionToken(req);
  } else if (app === 'customer') {
    token = readSessionToken(req, config.session.cookieNameCustomer) || readSessionToken(req);
  } else {
    // Fallback if no specific app detected
    token =
      readSessionToken(req) ||
      readSessionToken(req, config.session.cookieNameCustomer) ||
      readSessionToken(req, config.session.cookieNameDriver);
  }

  const user = token ? verifySession(token) : null;
  if (user) {
    (req as Request & { user?: SessionUser }).user = user;
  }
  next();
}

/** Attach user using driver-specific cookie. */
export function attachUserDriver(req: Request, _res: Response, next: NextFunction): void {
  const token = readSessionToken(req, config.session.cookieNameDriver);
  const user = token ? verifySession(token) : null;
  if (user) {
    (req as Request & { user?: SessionUser }).user = user;
  }
  next();
}

/** Attach user using customer-specific cookie. */
export function attachUserCustomer(req: Request, _res: Response, next: NextFunction): void {
  const token = readSessionToken(req, config.session.cookieNameCustomer);
  const user = token ? verifySession(token) : null;
  if (user) {
    (req as Request & { user?: SessionUser }).user = user;
  }
  next();
}

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: SessionUser }).user;
  if (!user) {
    res
      .status(401)
      .json({
        message: 'Anda belum masuk. Silakan login terlebih dahulu.',
        code: 'UNAUTHENTICATED',
      });
    return;
  }
  next();
}

/** Guard khusus app driver: wajib login dan role jastiper. */
export function requireJastiper(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: SessionUser }).user;
  if (!user) {
    res
      .status(401)
      .json({
        message: 'Anda belum masuk. Silakan login terlebih dahulu.',
        code: 'UNAUTHENTICATED',
      });
    return;
  }
  if (user.role !== 'jastiper') {
    res.status(403).json({ message: 'Akses khusus kurir.', code: 'FORBIDDEN' });
    return;
  }
  next();
}

/** Guard khusus app customer: wajib login. */
export function requireCustomer(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: SessionUser }).user;
  if (!user) {
    res
      .status(401)
      .json({
        message: 'Anda belum masuk. Silakan login terlebih dahulu.',
        code: 'UNAUTHENTICATED',
      });
    return;
  }
  next();
}

export function getUser(req: Request): SessionUser | null {
  return (req as Request & { user?: SessionUser }).user ?? null;
}

