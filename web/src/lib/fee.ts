import type { FeeConfig } from '../types';

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  platformFeeFlat: 2000,
  platformFeePercent: 0,
  cashbackPercent: 0,
  minPlatformFee: 2000,
  maxCashback: 25000,
};

export interface FeeInput {
  danaBelanja: number;
  ongkir: number;
  voucherDiscount?: number;
  cashbackPercent?: number;
  config?: Partial<FeeConfig>;
}

export interface FeeBreakdown {
  danaBelanja: number;
  ongkir: number;
  platformFee: number;
  voucherDiscount: number;
  cashback: number;
  customerPay: number;
  jastipperReceive: number;
  platformReceive: number;
}

/**
 * Modular fee calculation helper for Web Frontend.
 * Returns breakdown: customerPay, platformFee, jastipperReceive, cashback, etc.
 */
export function calculateFees(input: FeeInput): FeeBreakdown {
  const cfg: FeeConfig = { ...DEFAULT_FEE_CONFIG, ...(input.config ?? {}) };
  if (input.cashbackPercent !== undefined) {
    cfg.cashbackPercent = input.cashbackPercent;
  }

  const danaBelanja = Math.max(0, Math.round(Number(input.danaBelanja) || 0));
  const ongkir = Math.max(0, Math.round(Number(input.ongkir) || 0));
  const voucherDiscount = Math.max(0, Math.round(Number(input.voucherDiscount) || 0));

  const percentFee = Math.round((ongkir * (cfg.platformFeePercent || 0)) / 100);
  const rawPlatformFee = (cfg.platformFeeFlat || 0) + percentFee;
  const platformFee = Math.max(cfg.minPlatformFee || 0, rawPlatformFee);

  const subtotal = danaBelanja + ongkir + platformFee;
  const customerPay = Math.max(0, subtotal - voucherDiscount);

  let cashback = 0;
  if (cfg.cashbackPercent > 0) {
    const rawCashback = Math.round((customerPay * cfg.cashbackPercent) / 100);
    cashback = Math.min(cfg.maxCashback || 25000, rawCashback);
  }

  const jastipperReceive = danaBelanja + ongkir;
  const platformReceive = platformFee - cashback;

  return {
    danaBelanja,
    ongkir,
    platformFee,
    voucherDiscount,
    cashback,
    customerPay,
    jastipperReceive,
    platformReceive,
  };
}
