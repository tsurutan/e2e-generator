// Vitest setup for NestJS API tests
import { beforeAll, afterAll, beforeEach } from 'vitest'
import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from './test-database'

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/testpilot_test_db?schema=public'

// Global test setup
beforeAll(async () => {
  // テスト用データベースのセットアップ
  await setupTestDatabase()
})

beforeEach(async () => {
  // 各テスト前にデータベースをクリーンアップ
  await cleanupTestDatabase()
})

afterAll(async () => {
  // テスト終了後のクリーンアップ
  await cleanupTestDatabase()
  await closeTestDatabase()
})

afterAll(async () => {
  // Add any global cleanup logic here
})
