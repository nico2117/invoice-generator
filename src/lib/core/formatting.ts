export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}

const pad2 = (value: number) => String(value).padStart(2, '0')

export function formatCurrency(value: number): string {
  const fixed = Math.abs(value).toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const sign = value < 0 ? '-' : ''
  return `${sign}${grouped},${decPart}`
}

export function parseGermanNumber(input: string): number {
  const raw = input.trim()
  if (!raw) throw new ParseError('Invalid German number')

  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw.replace(/\s/g, '')

  const parsed = Number.parseFloat(normalized)
  if (Number.isNaN(parsed)) throw new ParseError('Invalid German number')
  return parsed
}

export function formatDate(date: Date): string {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`
}

export function parseGermanDate(input: string): Date {
  const raw = input.trim()
  const parts = raw.split('.')
  if (parts.length !== 3) throw new ParseError('Invalid German date')

  const [dayStr, monthStr, yearStr] = parts
  const day = Number.parseInt(dayStr, 10)
  const month = Number.parseInt(monthStr, 10)
  const year = Number.parseInt(yearStr, 10)

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    throw new ParseError('Invalid German date')
  }
  if (month < 1 || month > 12) throw new ParseError('Invalid German date')
  if (day < 1 || day > 31) throw new ParseError('Invalid German date')

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new ParseError('Invalid German date')
  }

  return date
}

export function deriveAnredeGruss(anrede: string): string {
  return anrede === 'Herrn' ? 'r Herr' : ' Frau'
}

export function formatIban(iban: string): string {
  const compact = iban.replace(/\s+/g, '')
  return compact.replace(/(.{4})(?=.)/g, '$1 ')
}
