import { getPrisma } from './src/services/prisma-client.js';

const prisma = getPrisma();

const PROMO_SLIDES = [
  {
    badge: 'PROMO EKSKLUSIF',
    title: 'Gratis Ongkir',
    subtitle: 'Hingga Rp 10.000 untuk pengguna baru',
    code: 'GRONGKIR12',
    gradient: 'from-primary via-primary-dark to-[#5C1A3A]',
    accent: 'text-primary-dark',
    imageUrl: 'http://localhost:4000/uploads/courier_scooter.png',
    period: 's.d. 31 Desember 2026',
  },
  {
    badge: 'HARI INI SAJA',
    title: 'Diskon 25% Titip Belanja',
    subtitle: 'Titip belanja ke supermarket favorit',
    code: 'JASTIP25',
    gradient: 'from-[#E65100] via-[#BF360C] to-[#D84315]',
    accent: 'text-[#BF360C]',
    imageUrl: '',
    period: 's.d. 31 Agustus 2026',
  },
  {
    badge: 'OPEN TRIP HEMAT',
    title: 'Diskon Jastip Luar Kota',
    subtitle: 'Titip oleh-oleh & jajanan khas daerah',
    code: 'TRIPHEMAT',
    gradient: 'from-[#1565C0] via-[#1976D2] to-[#1E88E5]',
    accent: 'text-[#1565C0]',
    imageUrl: '',
    period: 's.d. 30 September 2026',
  },
  {
    badge: 'SETIAP WEEKEND',
    title: 'Cashback 15%',
    subtitle: 'Maksimal Rp 25.000 tiap transaksi',
    code: 'WEEKEND15',
    gradient: 'from-[#2E7D32] via-[#388E3C] to-[#43A047]',
    accent: 'text-[#2E7D32]',
    imageUrl: '',
    period: 'Setiap akhir pekan s.d. 31 Desember 2026',
  },
  {
    badge: 'REFERRAL',
    title: 'Ajak Teman, Dapat Bonus',
    subtitle: 'Dapat Rp 20.000 per teman yang daftar',
    code: 'TEMANBARU',
    gradient: 'from-[#7B1FA2] via-[#9C27B0] to-[#AB47BC]',
    accent: 'text-[#7B1FA2]',
    imageUrl: '',
    period: 's.d. 31 Desember 2026',
  },
];

async function main() {
  console.log('Seeding promos...');
  for (const promo of PROMO_SLIDES) {
    await prisma.promo.create({
      data: {
        title: promo.title,
        badge: promo.badge,
        subtitle: promo.subtitle,
        code: promo.code,
        period: promo.period,
        imageUrl: promo.imageUrl,
        gradient: promo.gradient,
        accent: promo.accent,
        active: true,
      },
    });
  }
  console.log('Done seeding promos!');
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
