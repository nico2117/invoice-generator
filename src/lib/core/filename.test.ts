import { describe, it, expect } from 'vitest'
import { sanitizeForFilename, buildInvoiceFilename, padInvoiceNumber } from './filename'

describe('sanitizeForFilename', () => {
  it('transliterates ä → ae', () => expect(sanitizeForFilename('Bäcker')).toBe('Baecker'))
  it('transliterates ö → oe', () => expect(sanitizeForFilename('Öller')).toBe('Oeller'))
  it('transliterates ü → ue', () => expect(sanitizeForFilename('Müller')).toBe('Mueller'))
  it('transliterates Ä → Ae', () => expect(sanitizeForFilename('Ärger')).toBe('Aerger'))
  it('transliterates Ö → Oe', () => expect(sanitizeForFilename('Öl')).toBe('Oel'))
  it('transliterates Ü → Ue', () => expect(sanitizeForFilename('Über')).toBe('Ueber'))
  it('transliterates ß → ss', () => expect(sanitizeForFilename('Straße')).toBe('Strasse'))
  it('replaces spaces with underscores', () => expect(sanitizeForFilename('Foo Bar')).toBe('Foo_Bar'))
  it('replaces & with underscore', () => expect(sanitizeForFilename('Foo & Bar')).toBe('Foo_Bar'))
  it('collapses multiple underscores', () => expect(sanitizeForFilename('Foo  Bar')).toBe('Foo_Bar'))
  it('trims leading/trailing underscores', () => expect(sanitizeForFilename(' Foo ')).toBe('Foo'))
  it('full umlaut company name', () => 
    expect(sanitizeForFilename('Bäckerei Öller & Söhne GmbH'))
    .toBe('Baeckerei_Oeller_Soehne_GmbH'))
  it('path traversal: strips dots and slashes', () => {
    const r = sanitizeForFilename('../../etc/passwd')
    expect(r).not.toContain('.')
    expect(r).not.toContain('/')
    expect(r).not.toContain('\\')
  })
  it('truncates to 80 chars', () => {
    const long = 'A'.repeat(100)
    expect(sanitizeForFilename(long).length).toBeLessThanOrEqual(80)
  })
  it('returns "Empfaenger" for empty input', () => expect(sanitizeForFilename('')).toBe('Empfaenger'))
  it('returns "Empfaenger" for input that becomes empty after stripping', () => 
    expect(sanitizeForFilename('...')).toBe('Empfaenger'))
  it('Windows reserved names get suffix', () => {
    expect(sanitizeForFilename('CON')).not.toBe('CON')
    expect(sanitizeForFilename('nul')).not.toBe('nul')
    expect(sanitizeForFilename('COM1')).not.toBe('COM1')
  })
})

describe('padInvoiceNumber', () => {
  it('pads 14 to "014"', () => expect(padInvoiceNumber(14)).toBe('014'))
  it('pads 1 to "001"', () => expect(padInvoiceNumber(1)).toBe('001'))
  it('leaves 1234 as "1234" (> 3 digits)', () => expect(padInvoiceNumber(1234)).toBe('1234'))
})

describe('buildInvoiceFilename', () => {
  it('builds R2026-014_Mueller_GmbH.pdf', () =>
    expect(buildInvoiceFilename({ jahr: 2026, nummer: 14, empfaenger: 'Müller GmbH' }))
    .toBe('R2026-014_Mueller_GmbH.pdf'))
  it('transliterates umlauts in empfaenger', () =>
    expect(buildInvoiceFilename({ jahr: 2026, nummer: 3, empfaenger: 'Bäckerei Öller' }))
    .toBe('R2026-003_Baeckerei_Oeller.pdf'))
})
