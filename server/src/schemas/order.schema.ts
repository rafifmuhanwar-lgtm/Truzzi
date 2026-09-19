import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    orderType: z.enum(['suruh', 'jastip']).optional(),
    title: z.string().optional(),
    item: z.string().optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
    danaBelanja: z.number().min(0, 'Dana belanja tidak boleh negatif').optional(),
    budget: z.number().min(0).optional(),
    ongkir: z.number().min(0, 'Ongkir tidak boleh negatif').optional(),
    biayaLayanan: z.number().min(0, 'Biaya layanan tidak boleh negatif').optional(),
    totalAmount: z.number().min(0).optional(),
    pickupLat: z.number().optional(),
    pickupLng: z.number().optional(),
    dropoffLat: z.number().optional(),
    dropoffLng: z.number().optional(),
    pickupAddress: z.string().optional(),
    deliveryAddress: z.string().optional(),
  }),
});
