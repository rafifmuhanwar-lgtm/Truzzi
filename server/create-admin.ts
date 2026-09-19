import { getPrisma } from './src/services/prisma-client.js';
import bcrypt from 'bcryptjs';

const prisma = getPrisma();

async function main() {
  const email = 'admin@truzzix.go';
  const password = 'Rafif211206$_';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'admin',
    },
    create: {
      name: 'Super Admin',
      email,
      passwordHash,
      role: 'admin',
      selectedArea: 'All',
    },
  });

  console.log('Admin account created/updated:', admin.email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
