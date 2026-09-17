import { getPrisma } from './src/services/prisma-client.js';

async function main() {
  const prisma = getPrisma();
  const users = await prisma.user.count();
  const orders = await prisma.order.count();
  console.log('Users:', users, 'Orders:', orders);
}
main().catch(e => console.error(e));
