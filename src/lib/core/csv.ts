import { parse } from 'csv-parse/sync'
import type { TemplateSchema } from '@/lib/templates/types'
import { parseGermanNumber } from './formatting'

export interface ParsedRow { [key: string]: string }
export interface CsvParseError { line: number; column: string; message: string }
export interface ParseResult { rows: ParsedRow[]; errors: CsvParseError[] }

export function parseInvoiceCsv(buf: Buffer, schema: TemplateSchema): ParseResult {
  // 1. Encoding detection: try strict UTF-8 first, fall back to Windows-1252
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    text = new TextDecoder('windows-1252').decode(buf)
  }

  // 2. Strip BOM (U+FEFF)
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)

  // 3. Detect delimiter from first line
  const firstLine = text.split('\n')[0] ?? ''
  const delimiter = firstLine.includes(';') ? ';' : ','

  // 4. Parse CSV
  let rawRows: Record<string, string>[]
  try {
    rawRows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      delimiter,
      trim: true,
    }) as Record<string, string>[]
  } catch (e) {
    return {
      rows: [],
      errors: [{ line: 1, column: 'header', message: `CSV parse error: ${(e as Error).message}` }],
    }
  }

  // 5. Validate rows — collect errors, never abort
  const rows: ParsedRow[] = []
  const errors: CsvParseError[] = []

  const requiredFields = schema.fields
    .filter(f => f.required)
    .map(f => f.name)

  const currencyFields = schema.fields
    .filter(f => f.type === 'currency' || f.type === 'number')
    .map(f => f.name)

  rawRows.forEach((rawRow, index) => {
    const lineNum = index + 2  // header = line 1, first data row = line 2
    const rowErrors: CsvParseError[] = []

    // Normalise keys to lowercase
    const normalized: ParsedRow = {}
    for (const [k, v] of Object.entries(rawRow)) {
      normalized[k.toLowerCase().trim()] = v
    }

    // Required field check
    for (const field of requiredFields) {
      const val = normalized[field.toLowerCase()] ?? ''
      if (!val.trim()) {
        rowErrors.push({
          line: lineNum,
          column: field,
          message: `Pflichtfeld "${field}" fehlt`,
        })
      }
    }

    // Currency / number validation (only when value is present)
    for (const field of currencyFields) {
      const val = normalized[field.toLowerCase()] ?? ''
      if (val.trim()) {
        try {
          parseGermanNumber(val)
        } catch {
          rowErrors.push({
            line: lineNum,
            column: field,
            message: `Ungültige Zahl im Feld "${field}": "${val}"`,
          })
        }
      }
    }

    if (rowErrors.length === 0) {
      rows.push(normalized)
    } else {
      errors.push(...rowErrors)
    }
  })

  return { rows, errors }
}
