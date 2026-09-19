# Truzzi — React Web

Versi **website** dari aplikasi **Truzzi** (aplikasi on-demand delivery Indonesia: **Jastip** — titip belanja, & **Suruh** — suruh kurir). Dibangun dengan **Vite + React 18 + TypeScript + Tailwind** di folder `web/`, dan **Node + Express** proxy backend di folder `server/`.

> Sumber acuan visual & bisnis: aplikasi Flutter asli di `customer_app/` (monorepo Truzzi). Semua rumus ongkir, escrow, teks UI, dan auto-reply CS disalin persis dari source Flutter.

## Struktur

```
web/     — React web app customer (Vite + TS + Tailwind + React Router + React Query + Zustand + Leaflet + QR)
driver/  — React web app kurir/driver (Vite + TS + Tailwind, port 5174) — clone Flutter courier_app
server/  — Express REST API proxy + database (Prisma + PostgreSQL)
```

## Menjalankan — engine PostgreSQL (default)

```bash
npm install                          # root + web + server
# 1) Isi koneksi DB di server/.env
cp server/.env.example server/.env
#     DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/Truzzi_web?schema=public"
# 2) Buat database & aplikasikan skema
cd server
npx prisma db push --url "postgresql://postgres:PASSWORD@localhost:5432/Truzzi_web?schema=public"
npx tsx prisma/seed.ts               # promo "TITIPDB", 3 kurir, user demo
cd ..
npm run dev                          # server :4000 + web :5173 + driver :5174
```

- **Backend**: http://localhost:4000
- **Frontend customer**: http://localhost:5173
- **Frontend driver/kurir**: http://login kurir di http://localhost:5174 (`kurir@Truzzi.id` / `kurir12345`, lihat `driver/README.md`)
- **File upload lokal**: `server/uploads/` (disajikan di `/uploads/...`)

Buka http://localhost:5173 → Splash → pilih area → daftar/login. Semua data **permanen di PostgreSQL**.

### Engine alternatif (`.env`)

| `DATA_ENGINE`        | Database                                                  |
| -------------------- | --------------------------------------------------------- |
| `postgres` (default) | PostgreSQL via Prisma — auth bcrypt, Google OAuth mandiri |
| `appwrite`           | Appwrite DB (butuh API key)                               |
| `demo`               | in-memory (hilang saat restart) — tanpa DB                |

`STORAGE_ENGINE=local` (folder `server/uploads`) atau `=appwrite` (Appwrite Storage).

### Payment Gateway

| `PAYMENT_PROVIDER`   | Gateway                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| `buatqris` (default) | **BuatQris** (`https://buatqris.site`) — QRIS dinamis, webhook HMAC-SHA256 |
| `pakasir`            | Pakasir (gateway lama)                                                     |
| `demo`               | QR tiruan (tanpa charge asli)                                              |

Konfigurasi BuatQris di `.env`: `BUATQRIS_ACCOUNT_ID`, `BUATQRIS_SECRET_TOKEN`, `BUATQRIS_SIGNING_SECRET` (dari dashboard buatqris.site). Webhook otomatis terdaftar ke `{WEB_ORIGIN}/api/topup/webhook` dan diverifikasi dengan signature `X-BuatQris-Signature`.

### Google OAuth

- Buat **OAuth 2.0 Client ID (Web)** di Google Cloud Console.
- Redirect URI: `http://localhost:5173/#/google/callback`
- Isi `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` di `.env`.

## Alur arsitektur

```
Browser (React) ──> /api/* (Express proxy)
                     ├── Prisma → PostgreSQL (data)
                     ├── Pakasir QRIS (key hanya di server)
                     ├── Mapbox / OSRM / Nominatim (token hanya di server)
                     └── multer → server/uploads/ (folder lokal)
```

Frontend **tidak pernah** memegang secret database / Pakasir / Mapbox / Google.

## Route web (klon `app_router.dart`)

| Route                                                                    | Screen                                                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `/`                                                                      | Splash (3 detik → /main atau /location)                |
| `/location`                                                              | Pilih area (Kota Bekasi default)                       |
| `/login` `/register`                                                     | Masuk / Daftar (+ Google)                              |
| `/main`                                                                  | Shell 4 tab: Beranda / Order / Chat / Akun             |
| `/jastip` `/jastip/summary` `/jastip/success` `/jastip/delivery-address` | Form Titip Belanja → ringkasan → sukses                |
| `/suruh` `/suruh/summary`                                                | Form Suruh Kurir → ringkasan                           |
| `/order/detail` `/order/courier-receipt` `/tracking`                     | Detail, upload struk, tracking (peta + timeline)       |
| `/chat/room`                                                             | Obrolan kurir / CS (+auto-reply bot)                   |
| `/profile/*`                                                             | Edit, alamat, pembayaran, bantuan, tentang, notifikasi |
| `/wallet/topup`                                                          | Top up QRIS                                            |

## API utama (proxy)

- `POST/GET /api/auth/*` — register, login, me, logout, profile, google
- `POST/GET/PATCH /api/orders`, `GET /api/orders/:id/courier`, `POST /api/orders/:id/escrow`
- `GET/POST /api/chat/rooms/...`, `POST /api/chat/cs/bot-reply`
- `GET /api/wallet/:userId`, `GET .../escrows`, `GET .../topups`
- `POST /api/topup`, `GET /api/topup/:id`, `POST /api/topup/:id/simulate`
- `GET /api/geocode`, `/api/reverse-geocode`, `/api/distance`, `/api/places/search`
- `GET /api/promos`, `GET/POST /api/notifications`, `POST /api/upload`
- `GET/POST/PATCH/DELETE /api/addresses`

## Logika bisnis (identik Flutter)

- **Ongkir**: `max(roundUp(jarakKm×2000, 500), 5000)`; biaya layanan flat **Rp 2.000**; `total = danaBelanja + ongkir + biayaLayanan`.
- **Escrow**: selisih `danaBelanja − totalStruk`; `<0`+`jangan_lebih` → invalid; `≥0` → refund selisih; `<0`+`boleh_lebih` → topup approval.
- **Auto-reply CS**: keyword → jawaban (top up, COD, jastip, suruh, lupa password, saldo, refund, sapaan, default→CS).
- **Status order**: `Dana Diamankan — Mencari Kurir` → berjenjang → `Pesanan Selesai`.

## Kriteria (Definition of Done)

- [x] `tsc` + `vite build` tanpa error (server & web terverifikasi)
- [x] Semua route dapat dinavigasi (guard auth benar)
- [x] Login email/password & Google via proxy
- [x] Create order Jastip & Suruh → tersimpan → riwayat & tracking
- [x] Perhitungan ongkir & biaya layanan identik rumus Flutter
- [x] Escrow & over-budget mengikuti aturan Flutter
- [x] Chat + auto-reply CS berbasis keyword
- [x] Top up QRIS menampilkan QR & status ter-update (sandbox)
- [x] Upload foto (profil, jastip, struk, chat) via `/api/upload`
- [x] Visual burgundy `#7F1D3A`, font Poppins, kartu radius 12–20 px
- [x] Responsif mobile & desktop (max-w-lg, bottom nav tetap nyaman)

## Lisensi

Private / internal.
