import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter').max(50, 'Nama maksimal 50 karakter'),
    email: z.string().email('Format email tidak valid'),
    phone: z.string().min(10, 'Nomor HP tidak valid').max(15, 'Nomor HP terlalu panjang'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    selectedArea: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    selectedArea: z.string().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(50).optional(),
    phone: z.string().min(10).max(15).optional(),
    photoUrl: z.string().url().optional().or(z.literal('')),
  }),
});

