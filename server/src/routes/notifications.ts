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

// GET /api/notifications?userId=
router.get('/', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  const notifications = await db.listNotifications(user.id);
  res.json({ notifications });
});

// POST /api/notifications/read/:id
router.post('/read/:id', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  await db.markNotificationRead(req.params.id, user.id);
  res.json({ ok: true });
});

// POST /api/notifications/read-all
router.post('/read-all', requireUser, async (req: Request, res: Response) => {
  const user = getUser(req)!;
  await db.markAllNotificationsRead(user.id);
  res.json({ ok: true });
});

export default router;
