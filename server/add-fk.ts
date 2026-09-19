import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    await prisma.$executeRaw`ALTER TABLE "Courier" ADD CONSTRAINT "Courier_id_fkey" FOREIGN KEY (id) REFERENCES "User" (id) ON DELETE CASCADE ON UPDATE CASCADE;`;
    console.log('FK added');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

