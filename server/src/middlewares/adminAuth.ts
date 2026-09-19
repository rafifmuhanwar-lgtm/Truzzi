import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getPrisma } from '../services/prisma-client.js';

const JWT_SECRET = process.env.JWT_SECRET || 'truzzix_admin_secret_key_2026';

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const adminUser = await getPrisma().user.findUnique({ where: { id: decoded.id } });
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin user not found' });
    }

    // Attach admin to request if needed by other routes
    (req as any).adminUser = adminUser;

    next();
  } catch (error) {
    console.error('Admin Auth Error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

