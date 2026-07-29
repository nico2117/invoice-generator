import 'server-only'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '../client'
import { invoiceCounters, invoices } from '../schema'
import { nextNumber, NumberTakenError } from '@/lib/core/numbering'
import type { Db } from '../client'

/**
 * Peek at the next number without consuming it. Used to prefill the form.
 */
export async function peekNextNumber(jahr: number): Promise<number> {
  const db = getDb()
  const result = await db
    .select()
    .from(invoiceCounters)
    .where(eq(invoiceCounters.jahr, jahr))
    .limit(1)
  return (result[0]?.lastNumber ?? 0) + 1
}

/**
 * Allocate an invoice number inside a transaction.
 * Can be called standalone (QA) or enlisted in a caller-supplied transaction (Task 23).
 *
 * IMPORTANT: The QA scenarios call this standalone and leave the counter advanced
 * with no matching invoice rows. This is expected in a test DB — not a defect.
 *
 * @param jahr - the year for the counter
 * @param override - user-specified number (optional; if not set, auto-allocates)
 * @param tx - optional existing Drizzle transaction to enlist in
 */
export async function allocateNumber(
  jahr: number,
  override?: number,
  tx?: Awaited<Parameters<Parameters<Db['transaction']>[0]>[0]>
): Promise<number> {
  const db = getDb()

  async function doAllocate(trx: any) {
    // Lock the counter row FOR UPDATE, inserting if absent
    await trx.execute(sql`
      INSERT INTO invoice_counters (jahr, last_number)
      VALUES (${jahr}, 0)
      ON CONFLICT (jahr) DO NOTHING
    `)

    const rows = await trx.execute(sql`
      SELECT last_number FROM invoice_counters WHERE jahr = ${jahr} FOR UPDATE
    `)
    const lastNumber = (rows as unknown as { last_number: number }[])[0].last_number

    // Collect existing numbers for this year (for override collision check)
    let existingNumbers = new Set<number>()
    if (override !== undefined) {
      const existing = await trx
        .select({ rechnungsnummer: invoices.rechnungsnummer })
        .from(invoices)
        .where(eq(invoices.jahr, jahr))
       existingNumbers = new Set(existing.map((r: { rechnungsnummer: number }) => r.rechnungsnummer))
    }

    const { number, newLastNumber } = nextNumber(lastNumber, override, existingNumbers)

    await trx.execute(sql`
      UPDATE invoice_counters SET last_number = ${newLastNumber} WHERE jahr = ${jahr}
    `)

    return number
  }

  // If caller supplies a transaction, enlist in it; otherwise create our own
  if (tx) {
    return doAllocate(tx as unknown as typeof db)
  }
  return db.transaction(doAllocate)
}
