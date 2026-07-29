import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  parseGermanNumber,
  formatDate,
  parseGermanDate,
  deriveAnredeGruss,
  formatIban,
} from './formatting'

describe('formatCurrency', () => {
  it('formats 1234.5 as "1.234,50"', () => expect(formatCurrency(1234.5)).toBe('1.234,50'))
  it('formats 0 as "0,00"', () => expect(formatCurrency(0)).toBe('0,00'))
  it('formats 1000000 as "1.000.000,00"', () => expect(formatCurrency(1_000_000)).toBe('1.000.000,00'))
  it('formats 0.5 as "0,50"', () => expect(formatCurrency(0.5)).toBe('0,50'))
  it('formats 99.99 as "99,99"', () => expect(formatCurrency(99.99)).toBe('99,99'))
  it('always gives exactly 2 decimals', () => expect(formatCurrency(5)).toBe('5,00'))
})

describe('parseGermanNumber', () => {
  it('parses "1.234,50" as 1234.5', () => expect(parseGermanNumber('1.234,50')).toBe(1234.5))
  it('parses "1234,50" as 1234.5', () => expect(parseGermanNumber('1234,50')).toBe(1234.5))
  it('parses "1234.50" (dot as decimal) as 1234.5', () => expect(parseGermanNumber('1234.50')).toBe(1234.5))
  it('parses "1234" as 1234', () => expect(parseGermanNumber('1234')).toBe(1234))
  it('parses "0,00" as 0', () => expect(parseGermanNumber('0,00')).toBe(0))
  it('throws on "abc"', () => expect(() => parseGermanNumber('abc')).toThrow())
  it('throws on ""', () => expect(() => parseGermanNumber('')).toThrow())
  it('never returns NaN', () => {
    expect(() => parseGermanNumber('xyz')).toThrow()
  })
})

describe('formatDate', () => {
  it('formats as DD.MM.YYYY with zero-padding', () => {
    expect(formatDate(new Date(2026, 8, 14))).toBe('14.09.2026')
  })
  it('zero-pads single-digit day and month', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('05.01.2026')
  })
})

describe('parseGermanDate', () => {
  it('parses "14.09.2026" correctly', () => {
    const d = parseGermanDate('14.09.2026')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(8)
    expect(d.getDate()).toBe(14)
  })
  it('throws on "31.02.2026" (invalid calendar date)', () => {
    expect(() => parseGermanDate('31.02.2026')).toThrow()
  })
  it('throws on "abc"', () => expect(() => parseGermanDate('abc')).toThrow())
})

describe('deriveAnredeGruss', () => {
  it('"Herrn" produces "r Herr" (note: no leading space)', () => expect(deriveAnredeGruss('Herrn')).toBe('r Herr'))
  it('"Frau" produces " Frau" (note: leading space)', () => expect(deriveAnredeGruss('Frau')).toBe(' Frau'))
  it('empty string produces " Frau" (fallback, with leading space)', () => expect(deriveAnredeGruss('')).toBe(' Frau'))
  it('undefined cast to string produces " Frau"', () => expect(deriveAnredeGruss(undefined as unknown as string)).toBe(' Frau'))
})

describe('formatIban', () => {
  it('groups AT IBAN into blocks of 4', () => {
    expect(formatIban('AT47407303683307000')).toBe('AT47 4073 0368 3307 000')
  })
  it('already-grouped IBAN stays unchanged', () => {
    expect(formatIban('AT47 4073 0368 3307 0000')).toBe('AT47 4073 0368 3307 0000')
  })
  it('strips existing spaces then re-groups', () => {
    expect(formatIban('AT474073  03683307 0000')).toBe('AT47 4073 0368 3307 0000')
  })
})
