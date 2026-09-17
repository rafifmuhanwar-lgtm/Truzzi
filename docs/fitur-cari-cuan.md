# Rencana Fitur — "Cari Cuan" (Freelance Tugas Receh)

Versi: v0.1 (rencana) · Tanggal: 19 Agustus 2026
Status: **Rencana — belum ada kode yang ditulis untuk fitur ini**

> Tujuan: memberi wadah **tugas kecil berbayar** — digital maupun fisik — di dalam ekosistem Truzzi, dari mulai harga receh (Rp 5.000–Rp 50.000) hingga ukuran sedang. Pembayaran aman lewat escrow, selesai lewat bukti + persetujuan.

---

## 1. Mengapa ini "nyambung" dengan Truzzi

Infrastruktur yang **sudah ada** dan langsung dipakai ulang:

| Komponen | Sudah ada | Dipakai untuk |
|---|---|---|
| Escrow | `EscrowTransaction` (held → released/refunded) | Uang pembeli ditahan sampai tugas **disetujui** |
| Wallet/Saldo | `Wallet` (balance, topup, spend) | Pembayaran & pencairan hasil kerja |
| Chat | `ChatMessage` + room | Negosiasi/komunikasi per tugas |
| Notifikasi | `Notification` | Info tugas diambil / bukti dikirim / disetujui |
| Daftar status order | `OrderStatus` + `statusText` | Pola lifecycle status gig |
| Pengguna | `User` | Posisi **penyedia** (poster) & **pengerja** (worker) |
| (Opsional) Courier | `Courier` | Tugas fisik jarak jauh yang butuh antar-antar |

Jadi fitur ini **bukan sistem baru dari nol**, tapi satu "layer" microtask di atas model keuangan & komunikasi yang sudah ada.

---

## 2. Konsep inti

- **Gig (Tugas)** — pekerjaan kecil berbayar yang di-posting oleh satu user (penyedia) dan dikerjakan oleh user lain (worker).
- **Kategori**
  - **Digital** — bisa dikerjakan dari mana saja: nulis caption, edit foto singkat, terjemah 1 paragraf, isi data/entry, desain logo murah, upload jastip digital.
  - **Fisik** — butuh kehadiran di lokasi: ngecat tembok, perbaiki lampu, antri & ambilkan berkas, bantu beres-beres, jaga sebentar, titip sesuatu dibawa.
- **Harga "receh"** — desain harus hemat: input budget kecil, biaya layanan kecil/flat, tidak butuh diagram ongkir rumit untuk tugas digital.

---

## 3. Siklus hidup status (lifecycle)

```
  ┌──────────┐   worker ambil    ┌──────────────┐
  │  open    │ ─────────────────▶ │ in_progress  │
  └──────────┘   (escrow ditahan) └──────────────┘
       ▲                                │
       │ batal                          │ worker kirim bukti
       │                                ▼
  ┌──────────┐                     ┌────────────┐
  │ cancelled│                     │ submitted   │
  └──────────┘                     └────────────┘
       ▲                                │ penyedia setujui
       │                                ▼
       │                           ┌────────────┐
       └──── penyedia tolak /       │ completed  │ → escrow released
              expired              └────────────┘
```

1. **open** — gig diposting, escrow sudah menahan dana penyedia.
2. **in_progress** — worker mengambil; dana tetap ditahan.
3. **submitted** — worker unggah bukti foto/dokumen + catatan.
4. **completed** — penyedia menyetujui → escrow dilepas ke worker (dikurangi fee platform).
5. **cancelled** — penyedia membatalkan sebelum dikerjakan (dana dikembalikan penuh), atau gig expired.

---

## 4. Model database (Prisma) — tambahan baru

Diusulkan sebagai **tabel baru** (bukan menyewa tabel `Order`), agar tidak mengacaukan analitik/riwayat Jastip–Suruh.

```prisma
enum GigCategory {
  digital
  fisik
}

enum GigStatus {
  open
  in_progress
  submitted
  completed
  cancelled
}

model Gig {
  id            String      @id @default(cuid())
  posterId      String                       // penyedia (pemasang)
  workerId      String?                      // pengerja (nullable sampai diambil)
  title         String
  description   String
  category      GigCategory @default(digital)
  location      String?                      // wajib utk fisik; opsional utk digital
  budget        Float                        // nominal "receh"
  biayaLayanan  Float      @default(0)       // fee platform
  deadline      DateTime?
  status        GigStatus  @default(open)
  escrowId      String?
  proofImageUrl String?                      // path unggahan bukti (digital) 
  proofNote     String?
  createdBy     String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  poster User @relation("GigPoster", fields: [posterId], references: [id])
  worker User? @relation("GigWorker", fields: [workerId], references: [id])

  @@index([posterId])
  @@index([workerId])
  @@index([category])
  @@index([status])
}

model GigReview {
  id         String  @id @default(cuid())
  gigId      String
  reviewerId String
  rating     Int                            // 1–5
  comment    String?
  createdAt  DateTime @default(now())

  gig   Gig  @relation(fields: [gigId], references: [id])
  user  User @relation(fields: [reviewerId], references: [id])

  @@index([gigId])
  @@index([reviewerId])
}
```

Relasi di **User**: tambah `postedGigs Gig[]`, `workedGigs Gig[]`, `gigReviews GigReview[]`.

> Catatan: `data.ts` sudah punya 3 engine (postgres / memory / appwrite) dengan signature identik. Fitur ini ditambahkan di ke-3-nya (atau minimal postgres + memory dulu; appwrite menyusul).

---

## 5. Endpoint API (nilai default)

| Method | Path | Fungsi |
|---|---|---|
| GET | `/gigs` | Daftar gig (filter kategori, status, area, pencarian) |
| POST | `/gigs` | Pasang gig baru (buat escrow + tahan dana) |
| GET | `/gigs/:id` | Detail satu gig |
| POST | `/gigs/:id/take` | Worker mengambil gig (transisi open→in_progress) |
| POST | `/gigs/:id/submit` | Worker kirim bukti (in_progress→submitted) |
| POST | `/gigs/:id/approve` | Penyedia setujui → escrow release, fee dipotong, worker dapat saldo |
| POST | `/gigs/:id/cancel` | Batal (dana kembali penuh ke penyedia) |
| POST | `/gigs/:id/review` | Beri rating 1–5 + komentar |
| GET | `/gigs/mine?role=posted&role=worked` | Dua daftar untuk "Gig Saya" (yg dipasang & yg dikerjakan) |

Aturan penting di sisi server (jangan pernah percaya client):
- **Penyedia tidak boleh mengambil gig miliknya sendiri.**
- Dana **harus** menempel pada escrow sebelum `status=open` tampil di publik.
- `approve`/`cancel` hanya oleh `posterId`; `take`/`submit` hanya oleh worker (yang benar).
- `budget` dan `biayaLayanan` dihitung **server-side**, tidak dikirim bebas dari client.

---

## 6. Fee platform

Dua opsi, **masih perlu keputusan** (lihat bagian 9):

- **A. Persentase** — misal 10% dari budget, min. Rp 500. Adil untuk budget besar & kecil.
- **B. Flat** — misal Rp 1.000 per transaksi. Sangat "receh & sederhana".

Rekomendasi awal: **A (persentase, min. Rp 500)** — konsisten dengan fakta bahwa `biayaLayanan` di model Order sudah ada dan order summary menampilkannya, sehingga UX payout worker jadi seragam ("diterima Rp 4.500 dari budget Rp 5.000").

---

## 7. Halaman (screens) yang diusulkan

| Screen | Isi |
|---|---|
| **GigHomeScreen** (`/gigs`) | Tab **Buka** (list gig open, filter Digital/Fisik + area) & **Gig Saya** (yang dipasang / yang dikerjakan, dengan status) |
| **GigCreateScreen** (`/gigs/create`) | Form: judul, deskripsi, kategori, budget (quick-pick receh: 5rb/10rb/25rb/50rb), lokasi (jika fisik), deadline |
| **GigDetailScreen** (`/gigs/:id`) | Info lengkap + tombol kontekstual: **Ambil** (worker), **Kirim Bukti** (worker, saat in_progress), **Setujui** (penyedia, saat submitted), **Batal**, plus area chat ringkas |
| **GigSubmitScreen** / modal | Upload bukti (foto/teks) — berpola sama dengan upload struk di order |
| **Review** | Rating 1–5 + komentar saat completed |

Navigasi masuk: tombol **"Cari Cuan"** ditambahkan di halaman beranda (Quick Action ke-5) dan/atau di tab.

---

## 8. Alur lengkap MVP (walk-through)

1. Penyedia buka `/gigs/create`, isi form, pilih budget.
2. Server buat `Gig(status=open)` + `EscrowTransaction(held)` — dana di-/reserve dari wallet.
3. Gig muncul di list publik → worker tertarik → **Ambil**.
4. `status=in_progress`; `workerId` diisi. Notifikasi ke penyedia.
5. Worker kerjakan → **Kirim Bukti** (foto/teks) → `submitted`. Notifikasi ke penyedia.
6. Penyedia cek bukti → **Setujui** → server: `Gig(completed)`, escrow `released`, wallet worker += `budget − fee`, wallet penyedia tetap (sudah dikurangi saat awal), buat notifikasi.
7. Keduanya bisa saling **rating**.
8. Jika batal / expired → escrow `refunded`, dana kembali penuh ke penyedia.

---

## 9. Keputusan yang masih terbuka (perlu diputuskan bareng)

1. **Fee platform**: persentase (10% min 500) vs flat (Rp 1.000)?
2. **Siapa boleh jadi worker**: semua user, atau perlu verifikasi sederhana (mis. nomor HP tersua)?
3. **Maksimum gig aktif per user** (mis. 5) — untuk mencegah spam?
4. **Deadline/expired**: otomatis cancel setelah deadline lewat tanpa dikerjakan?
5. **Mode data**: implementasi pertama di **postgres + memory** dulu, atau sekaligus appwrite?

---

## 10. Roadmap

- **Fase 0 (sekarang)**: validasi bentuk & model di dokumen ini.
- **Fase 1 — MVP**: schema Prisma + migrate, data-layer 2 engine, endpoint `/gigs` + escrow + wallet, GigHome + Create + Detail + submit/approve. Tanpa map, tanpa real-time.
- **Fase 2**: notifikasi & chat per gig, filter/area lebih halus, rating/riwayat worker.
- **Fase 3**: dispute/support, moderasi konten, banner "Cari Cuan" di beranda, statistik penghasilan.

---

*Dokumen ini hidup — diperbarui tiap ada keputusan baru.*