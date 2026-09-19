import { getPrisma } from './src/services/prisma-client.js';
import bcrypt from 'bcryptjs';

async function main() {
  const prisma = getPrisma();

  const hash = await bcrypt.hash('password123', 10);

  // Create dummy Customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@truzzi.id' },
    update: { /* ignore */ },
    create: {
      id: 'usr_customer_01',
      email: 'customer@truzzi.id',
      name: 'Budi Pelanggan',
      passwordHash: hash,
      phone: '08111111111',
      role: 'customer',
      selectedArea: 'Jakarta',
    },
  });

  // Create dummy Jastiper
  const jastiperUser = await prisma.user.upsert({
    where: { email: 'jastiper@truzzi.id' },
    update: { /* ignore */ },
    create: {
      id: 'usr_jastiper_01',
      email: 'jastiper@truzzi.id',
      name: 'Siti Jastiper',
      passwordHash: hash,
      phone: '08222222222',
      role: 'jastiper',
      selectedArea: 'Jakarta',
      jastiperProfile: {
        create: {
          name: 'Siti Jastiper',
          isJastipActive: true,
          verified: true,
          category: 'Kuliner',
          selectedArea: 'Jakarta',
          rating: 4.8,
          totalOrders: 15,
        },
      },
    },
  });

  console.log('Dummy Customer created:', customer.email);
  console.log('Dummy Jastiper created:', jastiperUser.email);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

