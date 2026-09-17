import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { requireUser, readSessionToken, verifySession } from '../services/session.js';


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

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.VERCEL 
  ? path.join('/tmp', config.storage.uploadDir) 
  : path.resolve(_dirname, '../../', config.storage.uploadDir);

try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.warn('Could not create upload directory:', err);
}

// Folder lokal: simpan file ke disk dengan nama unik.
const localStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const name = path.basename(file.originalname || 'file', ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    cb(null, `${Date.now()}-${name}${ext}`);
  },
});
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true
  });
}

// Setup Cloudinary storage
const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'truzzi_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, crop: "limit" }, { quality: "auto" }, { fetch_format: "auto" }]
  } as any,
});

// Pilih storage berdasarkan env
const activeStorage = process.env.CLOUDINARY_URL ? cloudStorage : localStorage;
const activeUpload = multer({ storage: activeStorage, limits: { fileSize: 10 * 1024 * 1024 } });

import { adminAuth } from '../middlewares/adminAuth.js';

const authUpload = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user) {
    return next();
  }
  adminAuth(req, res, next);
};

// POST /api/upload
router.post('/', authUpload, activeUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File wajib diunggah (field "file")' });

    // Jika menggunakan Cloudinary, req.file.path berisi URL public dari Cloudinary
    if (process.env.CLOUDINARY_URL) {
      return res.status(201).json({ url: req.file.path, fileId: req.file.filename, demo: config.demo.enabled });
    }

    if (config.storage.engine === 'local') {
      const filename = path.basename(req.file.filename);
      const url = `/uploads/${filename}`;
      return res.status(201).json({ url, fileId: filename, demo: config.demo.enabled });
    }
    
    return res.status(500).json({ message: 'Storage engine not supported' });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Gagal mengunggah file' });
  }
});

export default router;
