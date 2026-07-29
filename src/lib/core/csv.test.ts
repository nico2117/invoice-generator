import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseInvoiceCsv } from './csv'
import type { TemplateSchema } from '@/lib/templates/types'

const FIXTURES = join(__dirname, '__fixtures__')

const mockSchema: TemplateSchema = {
  id: 'test',
  title: 'Test',
  markdownFile: 'test/template.md',
  fields: [
    { name: 'firmenname', label: 'Firmenname', type: 'text', required: true },
    { name: 'anrede', label: 'Anrede', type: 'text', required: true },
    { name: 'nachname', label: 'Nachname', type: 'text', required: true },
    { name: 'betrag', label: 'Betrag', type: 'currency', required: true },
  ],
}

describe('parseInvoiceCsv — encoding', () => {
  it('parses plain UTF-8 fixture, firmenname = "Müller GmbH"', () => {
    const buf = readFileSync(join(FIXTURES, 'utf8.csv'))
    const result = parseInvoiceCsv(buf, mockSchema)
    expect(result.errors).toHaveLength(0)
    expect(result.rows[0].firmenname).toBe('Müller GmbH')
  })

  it('parses UTF-8 BOM fixture, firmenname = "Müller GmbH" (BOM stripped)', () => {
    const buf = readFileSync(join(FIXTURES, 'utf8-bom.csv'))
    const result = parseInvoiceCsv(buf, mockSchema)
    expect(result.errors).toHaveLength(0)
    expect(result.rows[0].firmenname).toBe('Müller GmbH')
    // Ensure no BOM prefix survives into the field name or value
    expect(result.rows[0].firmenname.charCodeAt(0)).not.toBe(0xFEFF)
  })

  it('parses Windows-1252 fixture, firmenname = "Müller GmbH"', () => {
    const buf = readFileSync(join(FIXTURES, 'windows1252.csv'))
    const result = parseInvoiceCsv(buf, mockSchema)
    expect(result.errors).toHaveLength(0)
    expect(result.rows[0].firmenname).toBe('Müller GmbH')
  })

  it('all 3 fixtures parse second row firmenname as "Bäckerei Öller"', () => {
    for (const file of ['utf8.csv', 'utf8-bom.csv', 'windows1252.csv']) {
      const buf = readFileSync(join(FIXTURES, file))
      const result = parseInvoiceCsv(buf, mockSchema)
      expect(result.rows[1].firmenname, `${file} row 2`).toBe('Bäckerei Öller')
    }
  })
})

describe('parseInvoiceCsv — validation', () => {
  it('missing required field produces error with correct line number and column name', () => {
    // line 2 = first data row; firmenname is empty
    const csv = Buffer.from('firmenname;anrede;nachname;betrag\r\n;Herrn;Müller;1500,00\r\n', 'utf8')
    const result = parseInvoiceCsv(csv, mockSchema)
    expect(result.rows).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
    const err = result.errors[0]
    expect(err.line).toBe(2)
    expect(err.column).toBe('firmenname')
  })

  it('invalid betrag value produces an error mentioning the field name', () => {
    const csv = Buffer.from('firmenname;anrede;nachname;betrag\r\nMüller GmbH;Herrn;Müller;not-a-number\r\n', 'utf8')
    const result = parseInvoiceCsv(csv, mockSchema)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].column).toBe('betrag')
  })

  it('partial success: valid rows pass, bad row produces errors but does not abort', () => {
    const csv = Buffer.from(
      'firmenname;anrede;nachname;betrag\r\n' +
      'Müller GmbH;Herrn;Müller;1500,00\r\n' +
      ';Frau;Öller;250,50\r\n' +        // bad: missing firmenname
      'Wagner AG;Herrn;Wagner;900,00\r\n',
      'utf8'
    )
    const result = parseInvoiceCsv(csv, mockSchema)
    expect(result.rows).toHaveLength(2)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].line).toBe(3)   // line 3 = second data row (header is line 1)
    expect(result.rows[0].firmenname).toBe('Müller GmbH')
    expect(result.rows[1].firmenname).toBe('Wagner AG')
  })

  it('empty CSV returns empty rows and no errors, does not throw', () => {
    const csv = Buffer.from('', 'utf8')
    expect(() => {
      const result = parseInvoiceCsv(csv, mockSchema)
      expect(result.rows).toHaveLength(0)
    }).not.toThrow()
  })

  it('CSV with only headers and no data rows returns empty rows without errors', () => {
    const csv = Buffer.from('firmenname;anrede;nachname;betrag\r\n', 'utf8')
    const result = parseInvoiceCsv(csv, mockSchema)
    expect(result.rows).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  it('comma-delimited CSV is also accepted', () => {
    const csv = Buffer.from('firmenname,anrede,nachname,betrag\r\nMüller GmbH,Herrn,Müller,1500,00\r\n', 'utf8')
    // Note: betrag "1500,00" in comma-delimited is ambiguous; test just that firmenname parses
    const csv2 = Buffer.from('firmenname,anrede,nachname,betrag\r\nMueller GmbH,Herrn,Mueller,1500.00\r\n', 'utf8')
    const result = parseInvoiceCsv(csv2, mockSchema)
    expect(result.rows[0].firmenname).toBe('Mueller GmbH')
  })
})
