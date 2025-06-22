import { describe, it, expect } from 'vitest'

// Simple utility functions for testing
export const add = (a: number, b: number): number => a + b
export const multiply = (a: number, b: number): number => a * b
export const divide = (a: number, b: number): number => {
  if (b === 0) throw new Error('Division by zero')
  return a / b
}

describe('Math Utilities', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5)
    })

    it('should add negative numbers', () => {
      expect(add(-2, -3)).toBe(-5)
    })

    it('should add positive and negative numbers', () => {
      expect(add(5, -3)).toBe(2)
    })
  })

  describe('multiply', () => {
    it('should multiply two positive numbers', () => {
      expect(multiply(3, 4)).toBe(12)
    })

    it('should multiply by zero', () => {
      expect(multiply(5, 0)).toBe(0)
    })
  })

  describe('divide', () => {
    it('should divide two numbers', () => {
      expect(divide(10, 2)).toBe(5)
    })

    it('should throw error when dividing by zero', () => {
      expect(() => divide(10, 0)).toThrow('Division by zero')
    })
  })
})
