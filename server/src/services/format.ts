/** Format rupiah seperti Flutter `_formatCurrency`: `Rp 27.000` (titik ribuan). */
export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount);
  const s = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${s}`;
}

/** Strip non-digit, balik ke angka. */
export function parseRupiah(text: string): number {
  const n = Number(String(text).replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function toDateString(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso;
}
