import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import morgan from 'morgan';
import { config } from './config.js';
import { attachUser } from './services/session.js';
import authRouter from './routes/auth.js';
import orderRouter from './routes/orders.js';
import chatRouter from './routes/chat.js';
import walletRouter from './routes/wallet.js';
import topupRouter from './routes/topup.js';
import locationRouter from './routes/location.js';
import promoRouter from './routes/promos.js';
import notificationRouter from './routes/notifications.js';
import uploadRouter from './routes/upload.js';
import addressRouter from './routes/addresses.js';
import gigRouter from './routes/gigs.js';
import jastiperRouter from './routes/jastiper.js';
import adminRouter from './routes/admin.js';
import jastipersRouter from './routes/jastipers.js';
import favoriteRouter from './routes/favorites.js';
import jastipProductRouter from './routes/jastip-products.js';
import cronRouter from './routes/cron.js';

const app = express();

app.use((helmet as any)());
app.use(morgan('dev'));

// Global rate limiter
const limiter = (rateLimit as any)({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: { error: 'Terlalu banyak request dari IP ini, coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for Auth (login/register) to prevent brute force
const authLimiter = (rateLimit as any)({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: { error: 'Terlalu banyak percobaan login/register, coba lagi setelah 15 menit.' },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

app.use(
  cors({
    origin: config.server.webOrigins,
    credentials: true,
  }),
);
// Simpan raw body untuk verifikasi signature webhook (sebelum express.json parse).
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString('utf8');
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(hpp());
app.use(cookieParser());
app.use(attachUser);

app.use((req, res, next) => {
  console.log('[DEBUG] Incoming:', req.method, req.url, req.originalUrl);
  next();
});

app.get(['/', '/health', '/api/health'], (req, res) => {
  res.json({
    ok: true,
    url: req.url,
    originalUrl: req.originalUrl,
    demo: config.demo.enabled,
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/orders', orderRouter);
app.use('/api/chat', chatRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/topup', topupRouter);
app.use('/', locationRouter); // /api/geocode, /api/reverse-geocode, /api/distance, /api/places
app.use('/api', promoRouter); // /api/promos
app.use('/api/notifications', notificationRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/addresses', addressRouter);
app.use('/api/gigs', gigRouter);
app.use('/api/jastiper', jastiperRouter);
app.use('/api/admin', adminRouter);
app.use('/api/jastipers', jastipersRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/jastip-products', jastipProductRouter);
app.use('/api/cron', cronRouter);

// Serve file upload folder lokal (/uploads/...)
const _dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(_dirname, '../', config.storage.uploadDir);
app.use('/uploads', express.static(uploadDir));

// 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Rute tidak ditemukan' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err.message);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

if (!process.env.VERCEL) {
  app.listen(config.server.port, () => {
    console.log(`Truzzi backend proxy → http://localhost:${config.server.port}`);
    console.log(`Demo mode: ${config.demo.enabled ? 'ON' : 'OFF'}`);
  });
}

export default app;

