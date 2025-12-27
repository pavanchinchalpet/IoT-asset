import { PrismaClient } from '@prisma/client';

// Utility function to wake up Neon database
export async function wakeUpDatabase(prisma: PrismaClient, retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database is awake and connected');
      return true;
    } catch (error: any) {
      console.log(`🔄 Attempt ${i + 1}/${retries}: Waking up database...`);
      if (i < retries - 1) {
        // Wait before retry (Neon takes a few seconds to wake up)
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  console.error('❌ Failed to wake up database after', retries, 'attempts');
  return false;
}

// Utility function to execute database operations with retry
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  prisma: PrismaClient,
  retries = 2
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error.message.includes("Can't reach database server") && i < retries - 1) {
        console.log('🔄 Database seems to be sleeping, attempting to wake up...');
        await wakeUpDatabase(prisma);
      } else {
        throw error;
      }
    }
  }
  throw new Error('Operation failed after retries');
}