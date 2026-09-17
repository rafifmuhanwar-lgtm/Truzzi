# Gratis Ongkir Pricing Model — Truzzi

> **Tujuan:** Customer gratis ongkir, kurir tetap dapat insentif adil, platform kontrol budget.

---

## 1. Sumber Dana Gratis Ongkir

| Model | Siapa Bayar? | Kapan Dipakai |
|-------|--------------|---------------|
| **Min. Order Value (MOV)** | Customer (belanja ≥ threshold) | Default, aman |
| **Subscription (TruzziPass)** | Customer (bulanan/tahunan) | High-frequency user |
| **Merchant Subsidi** | Toko partner (marketing fee) | Jastip ke toko resmi |
| **Platform Absorb (Promo)** | Marketing budget | Acquisition/retention |
| **Voucher/Kode Promo** | Marketing budget | Campaign spesifik |

---

## 2. Insentif Kurir (Pendapatan per Order)

Kurir **tidak boleh rugi** meski `ongkir = 0` untuk customer.

```typescript
interface KurirFeeConfig {
  baseFeePerOrder: number;      // Flat fee per order (default: 5000)
  feePerKm: number;             // Per kilometer (default: 2000)
  feePerMin: number;            // Per menit estimasi (default: 200)
  commissionRate: number;       // % dari dana_belanja (jastip only, default: 0.03)
  minGuaranteed: number;        // Minimum total per order (default: 7000)
}

function hitungPendapatanKurir(order: Order, cfg: KurirFeeConfig): number {
  const { jarakKm, estimasiMenit, danaBelanja, orderType } = order;

  // 1. Distance-based fee
  const distanceFee = (jarakKm ?? 0) * cfg.feePerKm + (estimasiMenit ?? 0) * cfg.feePerMin;

  // 2. Commission dari dana belanja (hanya jastip)
  const commissionFee = orderType === 'jastip'
    ? (danaBelanja ?? 0) * cfg.commissionRate
    : 0;

  // 3. Total = max(baseFee, distanceFee) + commission
  const guaranteed = Math.max(cfg.baseFeePerOrder, distanceFee);
  const total = guaranteed + commissionFee;

  // 4. Floor minimum
  return Math.max(total, cfg.minGuaranteed);
}
```

### Contoh Perhitungan

| Order | Jarak | Waktu | Dana Belanja | Tipe | Base | Distance | Commission | **Total Kurir** |
|-------|-------|-------|--------------|------|------|----------|------------|-----------------|
| Gratis ongkir (MOV 75k) | 3 km | 15 min | 80.000 | Jastip | 5.000 | 3×2000 + 15×200 = 9.000 | 80.000 × 3% = 2.400 | **11.400** |
| Gratis ongkir (promo) | 5 km | 20 min | 100.000 | Suruh | 5.000 | 5×2000 + 20×200 = 14.000 | 0 | **14.000** |
| Normal (customer bayar ongkir 8k) | 2 km | 10 min | 50.000 | Jastip | 5.000 | 2×2000 + 10×200 = 6.000 | 50.000 × 3% = 1.500 | **7.500** |

> **Key:** `max(baseFee, distanceFee)` memastikan kurir dekat tetap dapet fee layak.

---

## 3. Alur Gratis Ongkir di Sistem

```mermaid
flowchart TD
    A[Customer checkout] --> B{Gratis ongkir aktif?}
    B -->|Ya: MOV / Promo / Voucher| C[Set ongkir = 0 untuk customer]
    B -->|Tidak| D[Ongkir normal = hitungOngkir(jarak)]
    C --> E[Platform hitung fee kurir via hitungPendapatanKurir()]
    D --> E
    E --> F[Kurir terima order dgn detail: "Gratis ongkir customer, pendapatan Anda: Rp X"]
    F --> G[Escrow hold total (dana + fee kurir)]
    G --> H[Selesaikan → release ke kurir & refund ke customer]
```

---

## 4. Config via Environment Variables

```env
# .env (production)
# --- Gratis Ongkir Threshold ---
FREE_SHIP_MIN_ORDER=75000        # MOV untuk gratis ongkir
FREE_SHIP_PROMO_CODES=GRONGKIR12,SHIPFREE  # Kode promo gratis ongkir

# --- Kurir Fee Config ---
KURIK_BASE_FEE=5000
KURIK_FEE_PER_KM=2000
KURIK_FEE_PER_MIN=200
KURIK_COMMISSION_RATE=0.03       # 3% dari dana belanja (jastip)
KURIK_MIN_GUARANTEED=7000

# --- Budget Control ---
DAILY_FREE_SHIP_BUDGET=5000000   # Max Rp 5jt/hari untuk subsidi ongkir
```

---

## 5. Transparansi di App Kurir

Tampilkan di **Detail Pesanan** (driver app):

```
┌─────────────────────────────────────┐
│ 📦 Pesanan: Jastip Kopi Susu        │
├─────────────────────────────────────┤
│ Customer: Gratis Ongkir (Promo)     │
│ Jarak: 3.2 km • Est. 14 menit       │
├─────────────────────────────────────┤
│ 💰 Pendapatan Anda: Rp 11.400       │
│    ├─ Base Fee: Rp 5.000            │
│    ├─ Jarak/Waktu: Rp 9.000         │
│    └─ Komisi 3%: Rp 2.400           │
│    (Min. garantor: Rp 7.000)        │
└─────────────────────────────────────┘
```

---

## 6. Budget Control & Monitoring

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Daily promo spend | > 80% daily budget | Pause promo codes |
| Avg kurir fee/order | < Rp 6.000 | Naikkan baseFee/feePerKm |
| Promo abuse (same user) | > 3x/hari | Block user dari promo |

---

## 7. Implementation Checklist

- [ ] `hitungPendapatanKurir()` di `services/pricing.ts`
- [ ] Config via `config.ts` + `.env`
- [ ] Update `courier.ts` receipt/complete flow pakai fee baru
- [ ] Driver UI: tampilkan breakdown pendapatan
- [ ] Admin dashboard: monitor daily promo spend
- [ ] Unit test untuk edge cases (jarak 0, dana belanja 0, dll)

---

## 8. Catatan Bisnis

| Scenario | Keputusan |
|----------|-----------|
| Customer pakai voucher gratis ongkir tapi kurir jauh | Platform absorb selisih (marketing budget) |
| Kurir menolak order gratis ongkir | Fee kurir dihitung tetap adil → kurir tidak rugi |
| Promo budget habis | Auto-disable kode promo, fallback ke MOV |
| Suruh (tidak ada dana belanja) | Hanya base + distance fee, no commission |

---

**Next Step:** Implement `services/pricing.ts` + update `courier.ts` receipt/complete flow.