import { getPrisma } from './src/services/prisma-client.js';

async function main() {
  const prisma = getPrisma();
  try {
    const rows = await prisma.user.findMany({ take: 100 });
    console.log('Users:', rows);
  } catch (e) {
    console.error('Prisma error:', e);
  }
}
main();
