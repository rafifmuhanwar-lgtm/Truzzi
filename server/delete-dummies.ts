import { getPrisma } from './src/services/prisma-client.js';

async function main() {
  const prisma = getPrisma();
  const dummyEmails = [
    'budi-pg@truzzi.id',
    'bq@truzzi.id',
    'gig.poster.test@truzzi.id',
    'gig.worker.test@truzzi.id'
  ];

  const users = await prisma.user.findMany({
    where: {
      email: { in: dummyEmails },
    }
  });

  console.log(`Found ${users.length} users to delete.`);

  for (const u of users) {
    try {
      console.log(`Deleting user: ${u.name} (${u.email})`);
      // Delete GigReview linked to the poster's/worker's gigs
      const gigs = await prisma.gig.findMany({ where: { OR: [{ posterId: u.id }, { workerId: u.id }] } });
      for (const g of gigs) {
        await prisma.gigReview.deleteMany({ where: { gigId: g.id } });
        // delete EscrowTransaction for this gig
        await prisma.escrowTransaction.deleteMany({ where: { gigId: g.id } });
      }

      await prisma.address.deleteMany({ where: { userId: u.id } });
      await prisma.paymentMethod.deleteMany({ where: { userId: u.id } });
      await prisma.notification.deleteMany({ where: { userId: u.id } });
      await prisma.chatMessage.deleteMany({ where: { senderId: u.id } });
      await prisma.escrowTransaction.deleteMany({ where: { userId: u.id } });
      await prisma.topUpTransaction.deleteMany({ where: { userId: u.id } });
      await prisma.gig.deleteMany({ where: { posterId: u.id } });
      await prisma.gig.deleteMany({ where: { workerId: u.id } });
      await prisma.gigReview.deleteMany({ where: { reviewerId: u.id } });
      
      const orders = await prisma.order.findMany({ where: { userId: u.id } });
      for (const o of orders) {
        await prisma.escrowTransaction.deleteMany({ where: { orderId: o.id } });
      }
      await prisma.order.deleteMany({ where: { userId: u.id } });
      
      // Finally delete the user
      await prisma.user.delete({ where: { id: u.id } });
      console.log(`Successfully deleted ${u.name}`);
    } catch (e: any) {
      console.error(`Failed to delete ${u.name}:`, e.message);
    }
  }

  console.log('Cleanup finished!');
}

main().catch(console.error).finally(() => process.exit(0));
