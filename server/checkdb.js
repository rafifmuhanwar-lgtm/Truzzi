const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.count();
  const orders = await prisma.order.count();
  console.log('Users:', users, 'Orders:', orders);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
