import type { ComponentType } from 'react';
import {
  ShoppingBasket,
  Coffee,
  Pill,
  Gift,
  Description,
  KeyRound,
  ReceiptText,
  Ticket,
} from '../components/icons';

/** Definisi kartu inspirasi (Titip & Suruh). */
export type InspirationDef = {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  service: 'titip' | 'suruh';
  about: string[];
  contoh: string[];
};

/** Inspirasi Titip Jastiper — barang yang mau dibeliin (jastip), nuansa hangat. */
export const TITIP_IDEAS: InspirationDef[] = [
  {
    title: 'Titip Belanja Warung',
    subtitle: 'Sembako & kebutuhan dapur',
    icon: ShoppingBasket,
    color: '#2E7D32',
    service: 'titip',
    about: [
      'Jastiper belanja di warung atau toko langgananmu',
      'Kamu tentukan daftar belanja & budget maksimal',
      'Struk & kembalian diantar bersama barang',
    ],
    contoh: ['Sembako, lauk, bumbu dapur', 'Galon minum & kebutuhan harian', 'Warung terdekat dari lokasimu'],
  },
  {
    title: 'Titip Kopi & Bakery',
    subtitle: 'Minuman kekinian & roti',
    icon: Coffee,
    color: '#E65100',
    service: 'titip',
    about: [
      'Antar beli minuman & makanan fresh',
      'Pilih outlet favorit atau terdekat',
      'Diantar cepat biar tetap hangat/dingin',
    ],
    contoh: ['Kopi susu, teh, jus kekinian', 'Roti bakar, pastry, dessert', 'Sekalian untuk teman atau keluarga'],
  },
  {
    title: 'Titip Obat Apotek',
    subtitle: 'Obat, vitamin & P3K',
    icon: Pill,
    color: '#C62828',
    service: 'titip',
    about: [
      'Beli obat & vitamin dari apotek',
      'Kirim daftar atau foto resep ke jastiper',
      'Obat diantar cepat & dibungkus rapi',
    ],
    contoh: ['Obat bebas (OTC) & vitamin', 'Obat sesuai resep dokter', 'P3K, masker, kebutuhan kesehatan'],
  },
  {
    title: 'Titip Kado & Hampers',
    subtitle: 'Ulang tahun & hadiah',
    icon: Gift,
    color: '#AD1457',
    service: 'titip',
    about: [
      'Beli kado & hampers untuk orang tersayang',
      'Pilih kisaran harga sesuai budget',
      'Bisa minta dibungkus rapi sebelum diantar',
    ],
    contoh: ['Kado ulang tahun & hadiah', 'Hampers makanan & bunga', 'Aksesori, parcel, souvenir'],
  },
];

/** Inspirasi Suruh Jastiper — aksi/tugas yang jastiper lakukan (bukan beli), nuansa dingin. */
export const SURUH_IDEAS: InspirationDef[] = [
  {
    title: 'Antar Dokumen',
    subtitle: 'Aman & rahasia',
    icon: Description,
    color: '#7F1D3A',
    service: 'suruh',
    about: [
      'Jastiper antar dokumen ke alamat tujuan',
      'Aman & rahasia, tanpa dibuka di jalan',
      'Estimasi ongkir dihitung dari jarak',
    ],
    contoh: ['Dokumen kontrak, surat penting', 'File administrasi, ijazah', 'Paket & barang kecil'],
  },
  {
    title: 'Ambil Barang',
    subtitle: 'Kunci / tas / tertinggal',
    icon: KeyRound,
    color: '#F57C00',
    service: 'suruh',
    about: [
      'Jastiper ambil barang di lokasi yang kamu tunjuk',
      'Cocok untuk barang tertinggal',
      'Barang diantar ke alamat tujuan',
    ],
    contoh: ['Kunci, tas, dompet tertinggal', 'Barang belanjaan di toko', 'Titipan dari teman atau keluarga'],
  },
  {
    title: 'Bayar & Ambil Pesanan',
    subtitle: 'Bayar di tempat, struk difoto',
    icon: ReceiptText,
    color: '#1565C0',
    service: 'suruh',
    about: [
      'Dana dititipkan lewat escrow lebih dulu',
      'Jastiper bayar di tempat & foto struknya',
      'Kembalian dikembalikan ke saldonya',
    ],
    contoh: ['Bayar pesanan makanan & minuman', 'Tebus obat atau barang di toko', 'DP / pelunasan di tempat'],
  },
  {
    title: 'Antri & Ambilkan Tiket',
    subtitle: 'Antrian bank, tiket, dsb',
    icon: Ticket,
    color: '#6A1B9A',
    service: 'suruh',
    about: [
      'Jastiper antri di lokasi untuk kamu',
      'Hemat waktu, kamu tinggal menunggu',
      'Perkembangan diinfokan lewat chat',
    ],
    contoh: ['Antrian bank, kantor pajak', 'Ambil tiket event / kereta', 'Antri loket & ambilkan dokumen'],
  },
];

