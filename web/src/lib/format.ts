/** Format rupiah persis Flutter `_formatCurrency`: `Rp 27.000` (titik ribuan). */
export function formatRupiah(amount: number | null | undefined): string {
  const n = Math.round(Number(amount ?? 0));
  const s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${s}`;
}

/** `Rp {angka}` tanpa ribuan separator (toStringAsFixed(0)). */
export function rawRupiah(amount: number | null | undefined): string {
  return `Rp ${Math.round(Number(amount ?? 0))}`;
}

/** Format pengali 1.000.000 → '2 jt', 1.500 → '1,5 rb'. */
export function formatCompact(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `${Math.round(v / 1_000_000)} jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1000 === 0 ? 0 : 1)} rb`;
  return String(Math.round(v));
}

/** Distance pill seperti Flutter: <1km → meter, else 1 desimal km. */
export function formatDistanceKm(km: number | null | undefined): string {
  const v = Number(km ?? 0);
  if (v < 1) return `${Math.round(v * 1000)} m`;
  return `${v.toFixed(1)} km`;
}

/** 'Hari ini' / 'Kemarin' / 'dd/MM/yyyy' — persis OrderScreen._formatDate. */
export function formatDay(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startToday - startThat) / 86400000);
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

/** 'Xm lalu' / 'Xj lalu' / 'Xh lalu' — persis OrderListScreen._formatTimeAgo. */
export function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j lalu`;
  return `${Math.floor(hours / 24)}h lalu`;
}

/** HH:mm — persis ChatMessageModel.formattedTime. */
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

/** dd/MM/yyyy HH:mm WIB — untuk expired Pakasir. */
export function formatDateTimeWib(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;
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