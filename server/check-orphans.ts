import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const couriers = await prisma.courier.findMany({ select: { id: true } });
  console.log(
    'All couriers:',
    couriers.map((c) => c.id),
  );

  const users = await prisma.user.findMany({ where: { role: 'courier' }, select: { id: true } });
  console.log(
    'Courier users:',
    users.map((u) => u.id),
  );

  const orphans = couriers.filter((c) => !users.some((u) => u.id === c.id));
  console.log('Orphans:', orphans);
}

main().finally(() => prisma.$disconnect());
