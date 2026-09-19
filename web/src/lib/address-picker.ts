import type { Address } from '../types';

/** Store hasil pemilihan alamat antar-route (naik-turun form). */
let pending: { address: string; data?: Partial<Address> } | null = null;

export function emitAddressPicked(a: { address: string; data?: Partial<Address> } | null): void {
  pending = a;
}

/** Konsumsi hasil pilihan (dipanggil saat form remount), menghapus sekali pakai. */
export function consumeAddressPicked(): { address: string; data?: Partial<Address> } | null {
  const p = pending;
  pending = null;
  return p;
}
