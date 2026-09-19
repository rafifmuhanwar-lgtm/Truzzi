import { z } from 'zod';

export const jastiperRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter').max(50, 'Nama maksimal 50 karakter'),
    email: z.string().email('Format email tidak valid'),
    phone: z.string().min(10, 'Nomor HP tidak valid').max(15, 'Nomor HP terlalu panjang'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    vehicleDetails: z.string().optional(),
    vehicleType: z.enum(['motor', 'mobil', 'lainnya']).optional(),
  }),
});

export const jastiperKycSchema = z.object({
  body: z.object({
    ktpUrl: z.string().url('URL KTP tidak valid'),
    selfieUrl: z.string().url('URL Selfie tidak valid'),
    
  }),
});

