import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

let prisma: PrismaClient;

export const getTestDatabase = (): PrismaClient => {
  if (!prisma) {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/testpilot_test_db?schema=public';
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }
  return prisma;
};

export const setupTestDatabase = async (): Promise<void> => {
  // テスト用データベースのマイグレーション実行
  try {
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/testpilot_test_db?schema=public',
      },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }
};

export const cleanupTestDatabase = async (): Promise<void> => {
  const testPrisma = getTestDatabase();
  
  // テストデータをクリーンアップ（外部キー制約の順序に注意）
  await testPrisma.uIStateTransition.deleteMany();
  await testPrisma.operationSession.deleteMany();
  await testPrisma.label.deleteMany();
  await testPrisma.edge.deleteMany();
  await testPrisma.uiState.deleteMany();
  await testPrisma.page.deleteMany();
  await testPrisma.scenario.deleteMany();
  await testPrisma.feature.deleteMany();
  await testPrisma.persona.deleteMany();
  await testPrisma.project.deleteMany();
};

export const closeTestDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
  }
};
