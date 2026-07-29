import 'server-only'
import { desc, eq, count, sql, and } from 'drizzle-orm'
import { getDb } from '../client'
import { invoices } from '../schema'

export type InvoiceSelect = typeof invoices.$inferSelect

interface ListInvoicesOptions {
  search?: string
  jahr?: number
  templateId?: string
  limit?: number
  offset?: number
}

export async function listInvoices(opts: ListInvoicesOptions = {}): Promise<InvoiceSelect[]> {
  const db = getDb()
  const { search, jahr, templateId, limit = 50, offset = 0 } = opts

  const conditions: ReturnType<typeof eq>[] = []
  if (search?.trim()) {
    conditions.push(sql`${invoices.pdfFilename} ilike ${`%${search.trim()}%`}` as ReturnType<typeof eq>)
  }
  if (jahr) conditions.push(eq(invoices.jahr, jahr))
  if (templateId) conditions.push(eq(invoices.templateId, templateId))

  let query = db.select().from(invoices).$dynamic()
  if (conditions.length > 0) {
    query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)!)
  }

  return query.orderBy(desc(invoices.createdAt)).limit(limit).offset(offset)
}

export async function getInvoice(id: string): Promise<InvoiceSelect | undefined> {
  const db = getDb()
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1)
  return result[0]
}

export async function countInvoices(opts: Omit<ListInvoicesOptions, 'limit' | 'offset'> = {}): Promise<number> {
  const db = getDb()
  const { search, jahr, templateId } = opts

  const conditions: ReturnType<typeof eq>[] = []
  if (search?.trim()) {
    conditions.push(sql`${invoices.pdfFilename} ilike ${`%${search.trim()}%`}` as ReturnType<typeof eq>)
  }
  if (jahr) conditions.push(eq(invoices.jahr, jahr))
  if (templateId) conditions.push(eq(invoices.templateId, templateId))

  let query = db.select({ value: count() }).from(invoices).$dynamic()
  if (conditions.length > 0) {
    query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions)!)
  }

  const result = await query
  return result[0]?.value ?? 0
}

export async function listYears(): Promise<number[]> {
  const db = getDb()
  const result = await db.selectDistinct({ jahr: invoices.jahr }).from(invoices).orderBy(desc(invoices.jahr))
  return result.map(r => r.jahr)
}
