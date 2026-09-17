/**
 * Tarif & aturan pembayaran Truzzi — disalin persis dari Flutter
 * `customer_app/lib/core/config/pricing_config.dart` & `ongkir_service.dart`.
 */
export const PRICING = {
  ongkirPerKm: 2000,
  ongkirMinimum: 5000,
  ongkirRounding: 500,
  biayaLayananFlat: 2000,
  biayaLayananPersen: 0.0,
};

/** Hitung ongkir: max(minimum, roundUpToNearest(jarakKm * tarifPerKm, pembulatan)). */
export function hitungOngkir(jarakKm: number): number {
  const raw = jarakKm * PRICING.ongkirPerKm;
  const rounded = roundUp(raw, PRICING.ongkirRounding);
  return rounded > PRICING.ongkirMinimum ? rounded : PRICING.ongkirMinimum;
}

/** Hitung biaya layanan: flat 2000, atau max(flat, persen*ongkir) bila persen > 0. */
export function hitungBiayaLayanan(ongkir: number): number {
  if (PRICING.biayaLayananPersen > 0) {
    const persen = ongkir * PRICING.biayaLayananPersen;
    return persen > PRICING.biayaLayananFlat ? persen : PRICING.biayaLayananFlat;
  }
  return PRICING.biayaLayananFlat;
}

/** Total = danaBelanja + ongkir + biayaLayanan. */
export function hitungTotal(danaBelanja: number, ongkir: number, biayaLayanan: number): number {
  return danaBelanja + ongkir + biayaLayanan;
}

/** Round up ke kelipatan tertentu. Contoh: 9250 → 9500 (kelipatan 500). */
function roundUp(amount: number, nearest: number): number {
  const factor = 1.0 / nearest;
  return Math.ceil(amount * factor) / factor;
}