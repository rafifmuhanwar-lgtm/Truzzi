import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@truzzi.id';
  const password = 'Rafif211206$_';
  const name = 'Truzzi Admin';

  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, role: 'admin' },
    create: {
      id: 'usr_admin123',
      email,
      name,
      passwordHash: hash,
      phone: '08123456789',
      role: 'admin',
    },
  });

  console.log('Admin seeded successfully:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
