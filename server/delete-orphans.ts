import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.courier.deleteMany({
    where: {
      id: { in: ['cmsyaut3200017ctuye57ogm6', 'cmsyaut3200027ctulmahh59e', 'cmsyaut3200037ctuxdf5tkw2'] }
    }
  });
  console.log('Deleted:', result.count);
}

main().finally(() => prisma.$disconnect());