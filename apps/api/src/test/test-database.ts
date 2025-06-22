import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import {PrismaService} from 'src/prisma/prisma.service';

let prisma: PrismaService;

export const getTestDatabase = (): PrismaService => {
  if (!prisma) {
    const databaseUrl = 'postgresql://postgres:postgres@localhost:5433/testpilot_test_db?schema=public';
    prisma = new PrismaService({
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

  try {
    // トランザクション内で順次削除を実行
    await testPrisma.$transaction(async (tx) => {
      // 外部キー制約の順序に従って削除
      await tx.uIStateTransition.deleteMany();
      await tx.operationSession.deleteMany();
      await tx.label.deleteMany();
      await tx.edge.deleteMany();
      await tx.uiState.deleteMany();
      await tx.page.deleteMany();
      await tx.scenario.deleteMany();
      await tx.feature.deleteMany();
      await tx.persona.deleteMany();
      await tx.project.deleteMany();
    });
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
    // トランザクションが失敗した場合は、TRUNCATEを試行
    try {
      // より強制的なクリーンアップ（TRUNCATE相当）
      // 外部キー制約を無視してすべてのテーブルをクリア
      await testPrisma.$executeRaw`TRUNCATE TABLE "ui_state_transitions" RESTART IDENTITY CASCADE`;
      await testPrisma.$executeRaw`TRUNCATE TABLE "operation_sessions" RESTART IDENTITY CASCADE`;
      await testPrisma.$executeRaw`TRUNCATE TABLE "labels" RESTART IDENTITY CASCADE`;
      await testPrisma.$executeRaw`TRUNCATE TABLE "edges" RESTART IDENTITY CASCADE`;
      await testPrisma.$executeRaw`TRUNCATE TABLE "ui_states" RESTART IDENTITY CASCADE`;
      await testPrisma.$executeRaw`TRUNCATE TABLE "pages" RESTART IDENTITY CASCADE`;
      await testPrisma.$executeRaw`TRUNCATE TABLE "scenarios" RESTART IDENTITY CASCADE`;
      await testPrisma.$executeRaw`TRUNCATE TABLE "features" RESTART IDENTITY CASCADE`;
      await testPrisma.$executeRaw`TRUNCATE TABLE "personas" RESTART IDENTITY CASCADE`;
      await testPrisma.$executeRaw`TRUNCATE TABLE "projects" RESTART IDENTITY CASCADE`;
    } catch (truncateError) {
      console.error('Failed to truncate tables:', truncateError);
      throw truncateError;
    }
  }
};

export const closeTestDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
  }
};

// 個別のテスト用にクリーンなPrismaインスタンスを作成
export const createTestPrismaInstance = (): PrismaService => {
  const databaseUrl = 'postgresql://postgres:postgres@localhost:5433/testpilot_test_db?schema=public';
  return new PrismaService({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
};

// 特定のPrismaインスタンスでクリーンアップを実行
export const cleanupTestDatabaseWithInstance = async (prismaInstance: PrismaService): Promise<void> => {
  try {
    // トランザクション内で順次削除を実行
    await prismaInstance.$transaction(async (tx) => {
      // 外部キー制約の順序に従って削除
      await tx.uIStateTransition.deleteMany();
      await tx.operationSession.deleteMany();
      await tx.label.deleteMany();
      await tx.edge.deleteMany();
      await tx.uiState.deleteMany();
      await tx.page.deleteMany();
      await tx.scenario.deleteMany();
      await tx.feature.deleteMany();
      await tx.persona.deleteMany();
      await tx.project.deleteMany();
    });
  } catch (error) {
    console.error('Failed to cleanup test database with instance:', error);
    // トランザクションが失敗した場合は、TRUNCATEを試行
    try {
      // より強制的なクリーンアップ（TRUNCATE相当）
      // 外部キー制約を無視してすべてのテーブルをクリア
      await prismaInstance.$executeRaw`TRUNCATE TABLE "ui_state_transitions" RESTART IDENTITY CASCADE`;
      await prismaInstance.$executeRaw`TRUNCATE TABLE "operation_sessions" RESTART IDENTITY CASCADE`;
      await prismaInstance.$executeRaw`TRUNCATE TABLE "labels" RESTART IDENTITY CASCADE`;
      await prismaInstance.$executeRaw`TRUNCATE TABLE "edges" RESTART IDENTITY CASCADE`;
      await prismaInstance.$executeRaw`TRUNCATE TABLE "ui_states" RESTART IDENTITY CASCADE`;
      await prismaInstance.$executeRaw`TRUNCATE TABLE "pages" RESTART IDENTITY CASCADE`;
      await prismaInstance.$executeRaw`TRUNCATE TABLE "scenarios" RESTART IDENTITY CASCADE`;
      await prismaInstance.$executeRaw`TRUNCATE TABLE "features" RESTART IDENTITY CASCADE`;
      await prismaInstance.$executeRaw`TRUNCATE TABLE "personas" RESTART IDENTITY CASCADE`;
      await prismaInstance.$executeRaw`TRUNCATE TABLE "projects" RESTART IDENTITY CASCADE`;
    } catch (truncateError) {
      console.error('Failed to truncate tables with instance:', truncateError);
      throw truncateError;
    }
  }
};
