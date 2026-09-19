/**
 * Settlement escrow setelah pesanan selesai — disalin persis dari Flutter
 * `customer_app/lib/core/services/escrow_settlement_service.dart`.
 */
export interface EscrowSettlementResult {
  refundCustomer: number; // dikembalikan ke wallet customer
  paymentToKurir: number; // reimbursement + ongkir ke kurir
  platformFee: number; // biaya layanan (pendapatan platform)
  reimbursementBelanja: number; // penggantian uang belanja kurir
  ongkirPaid: number; // ongkir yang dibayarkan ke kurir
  isOverBudget: boolean; // total belanja melebihi dana
  invalid: boolean; // true bila over budget & kebijakan 'jangan_lebih'
}

export function hitungSettlement(options: {
  danaBelanja: number;
  totalBelanjaStruk: number;
  ongkir: number;
  biayaLayanan: number;
  kebijakanLebih?: 'jangan_lebih' | 'boleh_lebih';
}): EscrowSettlementResult {
  const { danaBelanja, totalBelanjaStruk, ongkir, biayaLayanan } = options;
  const kebijakanLebih = options.kebijakanLebih ?? 'jangan_lebih';
  const selisih = danaBelanja - totalBelanjaStruk;

  // Melebihi dana & kebijakan jangan lebih → invalid
  if (selisih < 0 && kebijakanLebih === 'jangan_lebih') {
    return {
      refundCustomer: 0,
      paymentToKurir: 0,
      platformFee: biayaLayanan,
      reimbursementBelanja: 0,
      ongkirPaid: ongkir,
      isOverBudget: true,
      invalid: true,
    };
  }

  let refundCustomer: number;
  let reimbursementBelanja: number;

  if (selisih >= 0) {
    // Belanja kurang dari / sama dengan dana
    refundCustomer = selisih;
    reimbursementBelanja = totalBelanjaStruk;
  } else {
    // Belanja melebihi dana (boleh_lebih): customer bayar reimbursement = danaBelanja (full)
    refundCustomer = 0;
    reimbursementBelanja = danaBelanja;
  }

  return {
    refundCustomer,
    paymentToKurir: reimbursementBelanja + ongkir,
    platformFee: biayaLayanan,
    reimbursementBelanja,
    ongkirPaid: ongkir,
    isOverBudget: selisih < 0,
    invalid: false,
  };
}

