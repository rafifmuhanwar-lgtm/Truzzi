export interface FeeConfig {
  platformFeeFlat: number;
  platformFeePercent: number;
  cashbackPercent: number;
  minPlatformFee: number;
  maxCashback: number;
}

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
  cashbackCode?: string;
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
 * Modular fee calculation helper.
 * Calculates exact breakdown of customer payment, platform revenue, jastipper earnings, and cashback.
 */
export function calculateFees(input: FeeInput): FeeBreakdown {
  const cfg: FeeConfig = { ...DEFAULT_FEE_CONFIG, ...(input.config ?? { /* ignore */ }) };
  const danaBelanja = Math.max(0, Math.round(Number(input.danaBelanja) || 0));
  const ongkir = Math.max(0, Math.round(Number(input.ongkir) || 0));
  const voucherDiscount = Math.max(0, Math.round(Number(input.voucherDiscount) || 0));

  // Platform Fee calculation (flat + percentage of shipping/subtotal, subject to minPlatformFee)
  const percentFee = Math.round((ongkir * (cfg.platformFeePercent || 0)) / 100);
  const rawPlatformFee = (cfg.platformFeeFlat || 0) + percentFee;
  const platformFee = Math.max(cfg.minPlatformFee || 0, rawPlatformFee);

  // Subtotal before discounts
  const subtotal = danaBelanja + ongkir + platformFee;
  const customerPay = Math.max(0, subtotal - voucherDiscount);

  // Cashback calculation if eligible
  let cashback = 0;
  if (cfg.cashbackPercent > 0) {
    const rawCashback = Math.round((customerPay * cfg.cashbackPercent) / 100);
    cashback = Math.min(cfg.maxCashback || 25000, rawCashback);
  }

  // Jastipper receives dana belanja + ongkir
  const jastipperReceive = danaBelanja + ongkir;

  // Platform net after cashback
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

