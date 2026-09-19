/**
 * Auto-reply CS Truzzi — disalin persis dari Flutter `chat_provider.dart`.
 * Matching: includes() case-insensitive, first-match-wins, delay terapi 1500ms.
 */
const REPLY_PATTERNS: { keywords: string[]; reply: string }[] = [
  {
    keywords: ['top up', 'topup', 'isi saldo'],
    reply:
      'Untuk melakukan Top Up TruzziPay Wallet, silakan buka menu Akun > Pembayaran, lalu klik tombol "Top Up" pada kartu TruzziPay Wallet. Anda bisa mengisi saldo menggunakan QRIS (Scan & Bayar) tanpa biaya admin. Minimal top up Rp 10.000.',
  },
  {
    keywords: ['cod', 'tunai', 'bayar di tempat'],
    reply:
      'Saat ini Truzzi tidak mendukung metode pembayaran Tunai (COD). Hal ini untuk meminimalisir tindakan order fiktif dan memberikan keamanan bagi Mitra Kurir maupun Pelanggan. Seluruh transaksi dilakukan secara non-tunai melalui QRIS atau Saldo TruzziPay Wallet.',
  },
  {
    keywords: ['jastip', 'belanja'],
    reply:
      'Layanan Jastip Belanja memungkinkan Anda memesan barang dari toko dan dikirimkan oleh Mitra Kurir Truzzi. Caranya: buka menu Jastip Belanja dari Beranda, masukkan nama toko dan rincian barang, tentukan lokasi penjemputan dan pengiriman, lalu pilih metode pembayaran.',
  },
  {
    keywords: ['suruh', 'kurir', 'antar'],
    reply:
      'Layanan Titip Jastiper siap membantu Anda untuk membelikan oleh-oleh, makanan khas, barang mall, atau produk favorit dari berbagai kota secara aman dan terpercaya.',
  },
  {
    keywords: ['ongkir', 'biaya', 'tarif', 'harga', 'ongkos'],
    reply:
      'Tarif ongkos kirim flat jastiper sangat transparan dan hemat, mulai dari Rp 10.000 per pengantaran sesuai kesepakatan trip jastiper.',
  },
  {
    keywords: ['bayar', 'metode', 'qris', 'saldo', 'truzzipay', 'topup'],
    reply:
      'Saldo TruzziPay Wallet Anda bisa dicek di menu Akun > Pembayaran. Saldo bisa digunakan untuk membayar pesanan Titip Jastiper. Jika saldo kurang, silakan lakukan Top Up terlebih dahulu.',
  },
  {
    keywords: ['refund', 'kembali', 'dana kembali'],
    reply:
      'Untuk pengembalian dana (refund), tim Customer Service kami akan memprosesnya maksimal 1x24 jam setelah pengajuan diverifikasi. Dana akan dikembalikan ke Saldo TruzziPay Wallet Anda.',
  },
  {
    keywords: ['terima kasih', 'makasih', 'thanks'],
    reply:
      'Sama-sama! 😊 Senang bisa membantu. Jika ada pertanyaan lain, jangan ragu untuk menghubungi kami kembali ya.',
  },
  {
    keywords: ['halo', 'hy', 'hai', 'pagi', 'siang', 'sore', 'malam'],
    reply:
      'Halo! 👋 Ada yang bisa saya bantu? Silakan tanya seputar layanan Truzzi, top up saldo, atau kendala pesanan Anda.',
  },
];

const DEFAULT_REPLY =
  'Maaf, saya belum bisa menjawab pertanyaan tersebut. Pertanyaan Anda akan segera dialihkan ke Customer Service asli kami untuk mendapatkan bantuan lebih lanjut. ⏳\n\n' +
  'Atau Anda bisa menghubungi kami langsung melalui:\n' +
  '📞 WhatsApp: +62 811-900-800\n' +
  '📧 Email: support@truzzi.id';

/** Temukan balasan CS untuk pesan customer. Urutan pertama yang cocok menang. */
export function autoReplyCS(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  for (const { keywords, reply } of REPLY_PATTERNS) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return reply;
    }
  }
  return DEFAULT_REPLY;
}

