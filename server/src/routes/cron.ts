import { Router, type Request, type Response } from 'express';
import { getPrisma } from '../services/prisma-client.js';
import { finalizeOrder } from './jastiper.js';

const router = Router();

// GET /api/cron/auto-confirm
router.get('/auto-confirm', async (req: Request, res: Response) => {
  // Authorization check
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    
    // Find orders eligible for auto-confirm
    const eligibleOrders = await getPrisma().order.findMany({
      where: {
        status: 'waiting_confirmation',
        customerConfirmed: false,
        updatedAt: {
          lte: sixHoursAgo,
        },
      },
    });

    const results: Array<{ id: string; status: string; error?: string }> = [];
    for (const order of eligibleOrders) {
      try {
        await finalizeOrder(order.id, order);
        results.push({ id: order.id, status: 'success' });
      } catch (e: any) {
        console.error(`Failed to auto-confirm order ${order.id}:`, e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        results.push({ id: order.id, status: 'error', error: errorMessage });
      }
    }

    res.json({
      message: 'Auto-confirm cron job completed',
      processed: eligibleOrders.length,
      results,
    });
  } catch (error) {
    console.error('[cron] Auto-confirm error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
