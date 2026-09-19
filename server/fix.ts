import { getPrisma } from './src/services/prisma-client.js';
async function main() {
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(
    'DELETE FROM "Favorite" WHERE "jastiperId" NOT IN (SELECT id FROM "Jastiper")',
  );
  await prisma.$executeRawUnsafe(
    'DELETE FROM "JastipProduct" WHERE "jastiperId" NOT IN (SELECT id FROM "Jastiper")',
  );
  await prisma.$executeRawUnsafe(
    'DELETE FROM "Jastiper" WHERE "courierId" NOT IN (SELECT id FROM "Courier")',
  );
  console.log('Done cleaning');
}
main();

