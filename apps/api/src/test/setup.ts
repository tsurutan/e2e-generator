// Vitest setup for NestJS API tests
import { beforeAll, afterAll } from 'vitest'

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testpilot_test'

// Global test setup
beforeAll(async () => {
  // Add any global setup logic here
})

afterAll(async () => {
  // Add any global cleanup logic here
})
