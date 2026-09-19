import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const user = await prisma.user.create({
      data: { email: 'test-courier@x.id', name: 'Test', passwordHash: 'x', role: 'courier' },
    });
    const courier = await prisma.courier.create({
      data: { id: user.id, name: 'Test', email: user.email },
    });
    console.log('Created:', courier.id);

    try {
      await prisma.courier.create({ data: { id: 'fake-id', name: 'X', email: 'x@x.id' } });
      console.log('ERROR: should have failed');
    } catch (e) {
      console.log('FK working - rejected invalid courier');
    }

    await prisma.courier.delete({ where: { id: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Cleanup done');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
