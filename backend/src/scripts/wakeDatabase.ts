import { PrismaClient } from '@prisma/client';
import { wakeUpDatabase } from '../utils/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Attempting to wake up Neon database...');
  const success = await wakeUpDatabase(prisma, 5);
  
  if (success) {
    console.log('✅ Database is now awake and ready!');
  } else {
    console.error('❌ Failed to wake up database');
    process.exit(1);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);