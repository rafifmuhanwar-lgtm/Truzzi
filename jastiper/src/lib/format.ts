/** Format rupiah persis Flutter: `Rp1.000` (tanpa spasi, titik ribuan) — mayoritas layar jastiper_app. */
export function formatRupiah(amount: number | null | undefined): string {
  const n = Math.round(Number(amount ?? 0));
  const s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${s}`;
}

/** `Rp 1.000` (dengan spasi) — varian yang dipakai order_detail_screen.dart. */
export function formatRupiahSpaced(amount: number | null | undefined): string {
  const n = Math.round(Number(amount ?? 0));
  const s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${s}`;
}

/** 'Baru saja' / 'n menit yang lalu' / 'n jam yang lalu' / dd/MM/yyyy HH:mm — orders_screen.dart. */
export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 'n mnt lalu' / 'n jam lalu' / 'n hari lalu' / dd/MM/yyyy — notification_model.timeAgo. */
export function formatNotifTimeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** '{Jastip|Suruh} • {d MMM yyyy}' dengan bulan Indonesia — transaction_history_screen.dart. */
const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];
export function formatOrderDateShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function orderTypeLabel(type: string): string {
  return type === 'suruh' ? 'Suruh' : 'Jastip';
}

/** HH:mm — ChatMessageModel.formattedTime. */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** List time untuk room list: hari ini HH:mm, kemarin 'Kemarin', else dd/MM. */
export function formatRoomTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startToday - startThat) / 86400000);
  if (diffDays === 0) return formatTime(iso);
  if (diffDays === 1) return 'Kemarin';
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** Haversine jarak dua koordinat (km) — untuk sort 'Terdekat'. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Parse string rupiah ber-titik → angka. */
export function parseRupiah(text: string): number {
  const n = Number(text.replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Format input ribuan dot: 2000000 → 2.000.000 */
export function formatInputThousands(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
