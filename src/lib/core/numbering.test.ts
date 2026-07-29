import { describe, it, expect } from 'vitest'
import { nextNumber, formatInvoiceNumber, NumberTakenError } from './numbering'

describe('nextNumber - auto allocation', () => {
  it('returns lastNumber+1 when no override', () => {
    const { number, newLastNumber } = nextNumber(5)
    expect(number).toBe(6)
    expect(newLastNumber).toBe(6)
  })
  it('starts at 1 when counter is 0', () => {
    const { number } = nextNumber(0)
    expect(number).toBe(1)
  })
})

describe('nextNumber - override', () => {
  it('override below counter is allowed (back-fill)', () => {
    const { number, newLastNumber } = nextNumber(10, 5)
    expect(number).toBe(5)
    expect(newLastNumber).toBe(10)  // counter stays at 10
  })
  it('override above counter advances the counter', () => {
    const { number, newLastNumber } = nextNumber(5, 50)
    expect(number).toBe(50)
    expect(newLastNumber).toBe(50)  // counter advances to 50
  })
  it('override equal to lastNumber is allowed', () => {
    const { number } = nextNumber(5, 5, new Set())
    expect(number).toBe(5)
  })
  it('throws NumberTakenError when override collides', () => {
    expect(() => nextNumber(10, 7, new Set([7, 8]))).toThrow(NumberTakenError)
  })
  it('NumberTakenError message contains the number', () => {
    try { nextNumber(10, 7, new Set([7])) }
    catch (e) { expect((e as Error).message).toContain('7') }
  })
})

describe('formatInvoiceNumber', () => {
  it('zero-pads to 3 digits', () => expect(formatInvoiceNumber(2026, 14)).toBe('R2026-014'))
  it('does not truncate numbers > 3 digits', () => expect(formatInvoiceNumber(2026, 1234)).toBe('R2026-1234'))
  it('handles year and number together', () => expect(formatInvoiceNumber(2027, 1)).toBe('R2027-001'))
})
