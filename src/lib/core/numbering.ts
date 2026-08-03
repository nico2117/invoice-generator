export class NumberTakenError extends Error {
  constructor(jahr: number, nummer: number) {
    super(`Rechnungsnummer R${jahr}-${String(nummer).padStart(3,'0')} ist bereits vergeben. Löschen Sie die bestehende Rechnung, um die Nummer wiederzuverwenden.`)
    this.name = 'NumberTakenError'
  }
}

/**
 * Compute the next number and updated counter value.
 * Pure function — no DB access.
 *
 * @param lastNumber - current lastNumber from invoice_counters
 * @param override - explicit number requested by the user (optional)
 * @param existingNumbers - set of numbers already used in this year (for override validation)
 * @returns { number, newLastNumber }
 */
export function nextNumber(
  lastNumber: number,
  override?: number,
  existingNumbers: Set<number> = new Set()
): { number: number; newLastNumber: number } {
  if (override !== undefined) {
    if (existingNumbers.has(override)) {
      throw new NumberTakenError(0, override)
    }
    // If override is above current counter, advance the counter
    const newLastNumber = override > lastNumber ? override : lastNumber
    return { number: override, newLastNumber }
  }
  const number = lastNumber + 1
  return { number, newLastNumber: number }
}

export function formatInvoiceNumber(jahr: number, n: number): string {
  return `R${jahr}-${String(n).padStart(3, '0')}`
}
