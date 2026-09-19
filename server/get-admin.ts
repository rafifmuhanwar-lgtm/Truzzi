import { getPrisma } from './src/services/prisma-client.js';
async function main() {
  const admins = await getPrisma().user.findMany({});
  console.log(admins.filter((a) => a.role !== 'customer' && a.role !== 'courier'));
}
main();
