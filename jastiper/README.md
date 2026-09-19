# Truzzi Driver — Web App Kurir

Versi **website** dari aplikasi **Truzzi Courier App** (Flutter `courier_app/` di monorepo Truzzi). Dibangun dengan **Vite + React 18 + TypeScript + Tailwind**, berjalan di **port 5174** dan berbagi backend dengan customer app (`server/`, port 4000).

## Menjalankan

```bash
# dari root repo
npm run dev        # server :4000 + web :5173 + driver :5174
```

Atau terpisah:

```bash
cd driver && npm install && npm run dev   # http://localhost:5174
```

## Akun demo

| Akun       | Email             | Password     |
| ---------- | ----------------- | ------------ |
| Kurir demo | `kurir@Truzzi.id` | `kurir12345` |

Sudah KYC-verified; tinggal login → toggle **Online** → buka tab **Pesanan**.

## Alur fitur (mengikuti Flutter courier_app)

1. **Auth**: Register → Onboarding (kendaraan & area) → KYC (foto KTP + selfie, verifikasi instan) → Home.
2. **Orders**: 3 tab Tersedia/Aktif/Riwayat, filter jenis, urutkan Terbaru/Terdekat/Termahal/Termurah. Terima order → 5 tahap status: `Menuju Lokasi → Sampai di Lokasi → Barang Dibeli / Tugas Selesai → Dalam Perjalanan ke Tujuan → Pesanan Selesai`. Jastip wajib lewat upload struk (settlement escrow), selesai wajib foto bukti pengiriman.
3. **Pendapatan**: earnings = Σ ongkir (+ reimbursement struk utk jastip) − penarikan pending/approved. Tarik saldo min Rp 10.000.
4. **Chat**: room per order (aturan visibilitas 2 jam, input terkunci 6 jam setelah selesai), quick replies, kirim gambar. CS via `cs_chat_{courierId}`.
5. **Notifikasi**: kategori Pesanan/Promo & Info/Sistem & Akun, unread badge, tandai dibaca.

## Deviasi sadar dari Flutter asli

- **CS kurir** dibalas bot otomatis (`auto-reply.ts`) — aslinya menunggu admin manual.
- **URL foto KYC** disimpan di profil kurir (`kycKtpUrl`, `kycSelfieUrl`) — aslinya dibuang setelah upload.
- **Live location** memakai browser geolocation API — aslinya Geolocator dengan distanceFilter 10m.
- **Push notification FCM** belum di-port (web); notifikasi in-app polling saja.
