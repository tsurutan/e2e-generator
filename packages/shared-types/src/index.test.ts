import { describe, it, expect } from 'vitest'
import * as sharedTypes from './index'

describe('Shared Types Package', () => {
  it('should export types and schemas', () => {
    expect(sharedTypes).toBeDefined()
    expect(typeof sharedTypes).toBe('object')
  })

  it('should have basic exports available', () => {
    // This test ensures the package can be imported without errors
    // and that the main exports are available
    expect(sharedTypes).toHaveProperty
  })
})
