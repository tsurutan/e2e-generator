// E2E test setup for NestJS API
import { beforeAll, afterAll } from 'vitest'

// Mock environment variables for E2E testing
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testpilot_test'

// Global E2E test setup
beforeAll(async () => {
  // Add any global E2E setup logic here
  // For example: start test database, seed data, etc.
})

afterAll(async () => {
  // Add any global E2E cleanup logic here
  // For example: cleanup test database, close connections, etc.
})
